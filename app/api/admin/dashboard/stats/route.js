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
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isOnline: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });

    // Transaction statistics
    const depositStats = await Transaction.aggregate([
      { $match: { type: 'deposit', status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const withdrawalStats = await Transaction.aggregate([
      { $match: { type: 'withdraw', status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingDeposits = await Transaction.countDocuments({
      type: 'deposit',
      status: 'pending'
    });

    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdraw',
      status: 'pending'
    });

    const stats = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalDeposits: depositStats[0]?.total || 0,
      totalWithdrawals: withdrawalStats[0]?.total || 0,
      pendingDeposits,
      pendingWithdrawals
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
