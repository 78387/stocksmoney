import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await connectDB();
    
    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const defaultAdmin = new Admin({
      name: 'System Admin',
      email: 'admin@stocksmoney.com',
      password: hashedPassword,
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
    
    return NextResponse.json({
      message: 'Default admin created successfully',
      admin: {
        email: defaultAdmin.email,
        name: defaultAdmin.name,
        role: defaultAdmin.role
      },
      credentials: {
        email: 'admin@stocksmoney.com',
        password: 'admin123'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Admin initialization error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
