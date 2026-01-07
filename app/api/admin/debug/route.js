import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      return NextResponse.json({
        status: 'error',
        message: 'No token provided',
        token: null
      });
    }

    const decoded = verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid token',
        decoded: null
      });
    }

    if (!decoded.adminId) {
      return NextResponse.json({
        status: 'error',
        message: 'No adminId in token',
        decoded
      });
    }

    // Check if admin exists
    const admin = await Admin.findById(decoded.adminId);
    console.log('Admin found:', admin ? admin.email : 'Not found');

    return NextResponse.json({
      status: 'success',
      message: 'Token is valid',
      decoded,
      admin: admin ? {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      } : null
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
}
