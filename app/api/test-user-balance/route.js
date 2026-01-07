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

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User balance data',
      user: {
        email: user.email,
        name: user.name,
        balance: user.balance,
        depositBalance: user.depositBalance,
        rewardBalance: user.rewardBalance,
        hasNewFields: {
          depositBalance: user.depositBalance !== undefined,
          rewardBalance: user.rewardBalance !== undefined
        }
      }
    });

  } catch (error) {
    console.error('Test user balance error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
