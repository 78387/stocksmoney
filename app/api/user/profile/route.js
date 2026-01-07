import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      console.log('❌ No token provided in profile request');
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token in profile request:', token.substring(0, 20) + '...');
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        balance: user.balance || 0,
        depositBalance: user.depositBalance || 0,
        rewardBalance: user.rewardBalance || 0,
        bankDetails: user.bankDetails,
        status: user.status,
        country: user.country,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { name, mobile, bankDetails } = await request.json();

    // Validate mobile number if provided
    if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { message: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { 
        name,
        mobile,
        bankDetails 
      },
      { new: true }
    ).select('-password');

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        balance: user.balance || 0,
        depositBalance: user.depositBalance || 0,
        rewardBalance: user.rewardBalance || 0,
        bankDetails: user.bankDetails,
        status: user.status,
        country: user.country
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
