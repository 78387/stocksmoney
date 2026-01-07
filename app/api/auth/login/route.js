import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
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
    const rateLimitCheck = checkRateLimit(email);
    if (rateLimitCheck.isLocked) {
      console.log(`🔒 Login blocked for ${email} - ${rateLimitCheck.remainingTime} minutes remaining`);
      return NextResponse.json(
        { 
          message: `Too many failed login attempts. Account locked for ${rateLimitCheck.remainingTime} minutes.`,
          isLocked: true,
          remainingTime: rateLimitCheck.remainingTime,
          attempts: rateLimitCheck.attempts
        },
        { status: 429 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Record failed attempt for non-existent user too
      const failedAttempt = recordFailedAttempt(email);
      const remainingAttempts = getRemainingAttempts(email);
      
      console.log(`❌ Login failed for non-existent user: ${email} (${failedAttempt.attempts}/3 attempts)`);
      
      return NextResponse.json(
        { 
          message: 'Invalid credentials',
          remainingAttempts: remainingAttempts,
          attemptsUsed: failedAttempt.attempts
        },
        { status: 401 }
      );
    }

    if (user.status === 'blocked') {
      return NextResponse.json(
        { message: 'Your account has been blocked' },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Record failed attempt
      const failedAttempt = recordFailedAttempt(email);
      const remainingAttempts = getRemainingAttempts(email);
      
      console.log(`❌ Invalid password for ${email} (${failedAttempt.attempts}/3 attempts)`);
      
      let message = 'Invalid credentials';
      if (failedAttempt.isLocked) {
        message = `Too many failed login attempts. Account locked for ${failedAttempt.remainingTime} minutes.`;
      } else if (remainingAttempts <= 1) {
        message = `Invalid credentials. ${remainingAttempts} attempt remaining before account lock.`;
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
    clearFailedAttempts(email);

    // Update last login
    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    const token = generateToken({ userId: user._id });

    console.log(`✅ Successful login for ${email}`);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
