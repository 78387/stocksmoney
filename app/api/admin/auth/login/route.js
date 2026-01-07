import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';
import { 
  checkRateLimit, 
  recordFailedAttempt, 
  clearFailedAttempts, 
  getRemainingAttempts 
} from '@/lib/rateLimiter';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check rate limit before processing
    const rateLimitCheck = checkRateLimit(`admin_${email}`); // Prefix with admin_ to separate from user attempts
    if (rateLimitCheck.isLocked) {
      console.log(`🔒 Admin login blocked for ${email} - ${rateLimitCheck.remainingTime} minutes remaining`);
      return NextResponse.json(
        { 
          message: `Too many failed login attempts. Admin account locked for ${rateLimitCheck.remainingTime} minutes.`,
          isLocked: true,
          remainingTime: rateLimitCheck.remainingTime,
          attempts: rateLimitCheck.attempts
        },
        { status: 429 }
      );
    }

    // Check if any admin exists, if not create default admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultAdmin = new Admin({
        email: 'admin@stocksmoney.com',
        password: await hashPassword('admin123'),
        name: 'System Administrator',
        role: 'super_admin',
        permissions: {
          manageUsers: true,
          manageTransactions: true,
          manageProducts: true,
          viewReports: true,
          manageAdmins: true,
          changePassword: true
        }
      });
      await defaultAdmin.save();
      console.log('✅ Default super admin created: admin@stocksmoney.com / admin123');
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Record failed attempt for non-existent admin
      const failedAttempt = recordFailedAttempt(`admin_${email}`);
      const remainingAttempts = getRemainingAttempts(`admin_${email}`);
      
      console.log(`❌ Admin login failed for non-existent admin: ${email} (${failedAttempt.attempts}/3 attempts)`);
      
      return NextResponse.json(
        { 
          message: 'Invalid admin credentials',
          remainingAttempts: remainingAttempts,
          attemptsUsed: failedAttempt.attempts
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      // Record failed attempt
      const failedAttempt = recordFailedAttempt(`admin_${email}`);
      const remainingAttempts = getRemainingAttempts(`admin_${email}`);
      
      console.log(`❌ Invalid password for admin ${email} (${failedAttempt.attempts}/3 attempts)`);
      
      let message = 'Invalid admin credentials';
      if (failedAttempt.isLocked) {
        message = `Too many failed login attempts. Admin account locked for ${failedAttempt.remainingTime} minutes.`;
      } else if (remainingAttempts <= 1) {
        message = `Invalid admin credentials. ${remainingAttempts} attempt remaining before account lock.`;
      }
      
      return NextResponse.json(
        { 
          message,
          isLocked: failedAttempt.isLocked,
          remainingTime: failedAttempt.remainingTime,
          remainingAttempts: remainingAttempts,
          attemptsUsed: failedAttempt.attempts
        },
        { status: failedAttempt.isLocked ? 429 : 401 }
      );
    }

    // Successful login - clear failed attempts
    clearFailedAttempts(`admin_${email}`);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken({ adminId: admin._id });

    console.log(`✅ Successful admin login for ${email}`);

    return NextResponse.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
