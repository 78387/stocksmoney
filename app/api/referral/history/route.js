import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
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

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // If user doesn't have referral code, return empty data
    if (!user.referralCode) {
      return NextResponse.json({
        referralCode: null,
        totalReferrals: 0,
        totalEarnings: 0,
        referralHistory: [],
        transactions: []
      });
    }

    // Get all users referred by this user
    const referredUsers = await User.find({ 
      referredBy: user.referralCode 
    }).select('name email createdAt status').sort({ createdAt: -1 });

    // Get all referral transactions for this user
    const referralTransactions = await Transaction.find({
      userId: decoded.userId,
      type: 'referral'
    }).sort({ createdAt: -1 });

    // Calculate total earnings from referrals
    const totalEarnings = referralTransactions.reduce((sum, transaction) => {
      return sum + transaction.amount;
    }, 0);

    // Combine referral data
    const referralHistory = referredUsers.map(referredUser => {
      const transaction = referralTransactions.find(t => 
        t.referralData?.referredUserId?.toString() === referredUser._id.toString()
      );
      
      return {
        _id: referredUser._id,
        name: referredUser.name,
        email: referredUser.email,
        joinedAt: referredUser.createdAt,
        status: referredUser.status,
        bonusAmount: transaction?.amount || 0,
        bonusDate: transaction?.createdAt || null
      };
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      totalReferrals: referredUsers.length,
      totalEarnings,
      referralHistory,
      transactions: referralTransactions
    });

  } catch (error) {
    console.error('Get referral history error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
