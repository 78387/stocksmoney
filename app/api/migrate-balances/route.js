import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    // This is a one-time migration script
    // Get all users
    const users = await User.find({});
    
    let updatedUsers = 0;
    
    for (const user of users) {
      // Calculate deposit balance from approved deposit transactions
      const depositTransactions = await Transaction.find({
        userId: user._id,
        type: 'deposit',
        status: 'approved'
      });
      
      const depositBalance = depositTransactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);
      
      // Calculate reward balance from reward and referral transactions
      const rewardTransactions = await Transaction.find({
        userId: user._id,
        type: { $in: ['reward', 'referral'] },
        status: 'completed'
      });
      
      const rewardBalance = rewardTransactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);
      
      // Calculate withdrawn amounts
      const withdrawTransactions = await Transaction.find({
        userId: user._id,
        type: 'withdraw',
        status: { $in: ['approved', 'completed'] }
      });
      
      const withdrawnAmount = withdrawTransactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);
      
      // Update user with calculated balances
      const finalRewardBalance = Math.max(0, rewardBalance - withdrawnAmount);
      const totalBalance = depositBalance + finalRewardBalance;
      
      await User.findByIdAndUpdate(user._id, {
        depositBalance: depositBalance,
        rewardBalance: finalRewardBalance,
        balance: totalBalance
      });
      
      updatedUsers++;
    }
    
    return NextResponse.json({
      message: 'Balance migration completed successfully',
      updatedUsers
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { message: 'Migration failed', error: error.message },
      { status: 500 }
    );
  }
}
