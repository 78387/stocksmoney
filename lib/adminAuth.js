import { verifyToken, getTokenFromRequest } from './auth';
import Admin from '@/models/Admin';
import connectDB from './db';

export async function verifyAdminPermission(request, requiredPermission) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return { error: 'Invalid admin token', status: 401 };
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return { error: 'Admin not found', status: 404 };
    }

    // Check if admin has required permission
    if (!admin.permissions[requiredPermission]) {
      return { error: 'Insufficient permissions', status: 403 };
    }

    return { admin, decoded };
  } catch (error) {
    console.error('Admin permission verification error:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

export function hasPermission(admin, permission) {
  return admin.permissions[permission] === true;
}
