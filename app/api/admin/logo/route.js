import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Get current logo
export async function GET(request) {
  try {
    // Check if logo file exists
    const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logo.png');
    
    try {
      await require('fs').promises.access(logoPath);
      return NextResponse.json({
        logoUrl: '/uploads/logo.png',
        hasLogo: true
      });
    } catch {
      return NextResponse.json({
        logoUrl: null,
        hasLogo: false
      });
    }

  } catch (error) {
    console.error('Get logo error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Upload logo
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

    const formData = await request.formData();
    const file = formData.get('logo');

    if (!file) {
      return NextResponse.json(
        { message: 'No logo file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WebP image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file as logo.png (overwrite existing)
    const logoPath = path.join(uploadsDir, 'logo.png');
    await writeFile(logoPath, buffer);

    console.log('✅ Logo uploaded successfully');

    return NextResponse.json({
      message: 'Logo uploaded successfully',
      logoUrl: '/uploads/logo.png'
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Delete logo
export async function DELETE(request) {
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

    const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logo.png');
    
    try {
      await require('fs').promises.unlink(logoPath);
      console.log('✅ Logo deleted successfully');
      
      return NextResponse.json({
        message: 'Logo deleted successfully'
      });
    } catch (error) {
      return NextResponse.json(
        { message: 'Logo not found or already deleted' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Delete logo error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
