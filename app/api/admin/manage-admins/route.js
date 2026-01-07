import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { verifyToken, getTokenFromRequest, hashPassword, comparePassword } from '@/lib/auth';

// Get all admins
export async function GET(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // Check if current admin has permission to manage admins
    const currentAdmin = await Admin.findById(decoded.adminId);
    if (!currentAdmin || (!currentAdmin.permissions?.manageAdmins && currentAdmin.role !== 'super_admin')) {
      return NextResponse.json(
        { message: 'Insufficient permissions to manage admins' },
        { status: 403 }
      );
    }

    // Get all admins except passwords
    const admins = await Admin.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      admins,
      currentAdminId: decoded.adminId
    });

  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Create new admin or update existing admin
export async function POST(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { action, adminData, currentPassword, newPassword } = await request.json();

    const currentAdmin = await Admin.findById(decoded.adminId);
    if (!currentAdmin) {
      return NextResponse.json(
        { message: 'Current admin not found' },
        { status: 404 }
      );
    }

    // Handle password change
    if (action === 'changePassword') {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { message: 'Current password and new password are required' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, currentAdmin.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      // Update password
      currentAdmin.password = await hashPassword(newPassword);
      await currentAdmin.save();

      console.log(`✅ Password changed for admin: ${currentAdmin.email}`);

      return NextResponse.json({
        message: 'Password changed successfully'
      });
    }

    // Handle creating new admin
    if (action === 'createAdmin') {
      // Check if current admin has permission to manage admins
      if (!currentAdmin.permissions?.manageAdmins && currentAdmin.role !== 'super_admin') {
        return NextResponse.json(
          { message: 'Insufficient permissions to create admins' },
          { status: 403 }
        );
      }

      const { name, email, password, role, permissions } = adminData;

      if (!name || !email || !password) {
        return NextResponse.json(
          { message: 'Name, email, and password are required' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return NextResponse.json(
          { message: 'Admin with this email already exists' },
          { status: 409 }
        );
      }

      // Only super_admin can create other super_admins
      if (role === 'super_admin' && currentAdmin.role !== 'super_admin') {
        return NextResponse.json(
          { message: 'Only super admin can create other super admins' },
          { status: 403 }
        );
      }

      // Create new admin
      const newAdmin = new Admin({
        name,
        email,
        password: await hashPassword(password),
        role: role || 'admin',
        permissions: {
          manageUsers: permissions?.manageUsers ?? true,
          manageTransactions: permissions?.manageTransactions ?? true,
          manageProducts: permissions?.manageProducts ?? true,
          viewReports: permissions?.viewReports ?? true,
          manageAdmins: permissions?.manageAdmins ?? false,
          changePassword: permissions?.changePassword ?? true
        }
      });

      await newAdmin.save();

      console.log(`✅ New admin created: ${newAdmin.email} by ${currentAdmin.email}`);

      return NextResponse.json({
        message: 'Admin created successfully',
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          permissions: newAdmin.permissions
        }
      });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin management error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Update admin permissions or delete admin
export async function PUT(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { action, adminId, permissions, role } = await request.json();

    const currentAdmin = await Admin.findById(decoded.adminId);
    if (!currentAdmin || (!currentAdmin.permissions?.manageAdmins && currentAdmin.role !== 'super_admin')) {
      return NextResponse.json(
        { message: 'Insufficient permissions to manage admins' },
        { status: 403 }
      );
    }

    if (action === 'updatePermissions') {
      const targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        return NextResponse.json(
          { message: 'Admin not found' },
          { status: 404 }
        );
      }

      // Can't modify super_admin unless you are super_admin
      if (targetAdmin.role === 'super_admin' && currentAdmin.role !== 'super_admin') {
        return NextResponse.json(
          { message: 'Cannot modify super admin permissions' },
          { status: 403 }
        );
      }

      // Update permissions
      if (permissions) {
        targetAdmin.permissions = { ...targetAdmin.permissions, ...permissions };
      }

      // Update role (only super_admin can change roles)
      if (role && currentAdmin.role === 'super_admin') {
        targetAdmin.role = role;
      }

      await targetAdmin.save();

      console.log(`✅ Admin permissions updated for ${targetAdmin.email} by ${currentAdmin.email}`);

      return NextResponse.json({
        message: 'Admin permissions updated successfully',
        admin: {
          id: targetAdmin._id,
          name: targetAdmin.name,
          email: targetAdmin.email,
          role: targetAdmin.role,
          permissions: targetAdmin.permissions
        }
      });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
