import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    console.log('Starting balance initialization...');
    
    // Get all users
    const users = await User.find({});
    let processedUsers = 0;
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Calculate deposit balance from approved deposits
      const approvedDeposits = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'deposit',
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const depositBalance = approvedDeposits[0]?.total || 0;
      
      // Calculate reward balance from rewards and referrals
      const rewardEarnings = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: { $in: ['reward', 'referral'] },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const totalRewardEarnings = rewardEarnings[0]?.total || 0;
      
      // Calculate total withdrawals (these come from reward balance only)
      const withdrawals = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'withdraw',
            status: { $in: ['approved', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const totalWithdrawals = withdrawals[0]?.total || 0;
      
      // Calculate final balances
      const finalRewardBalance = Math.max(0, totalRewardEarnings - totalWithdrawals);
      const finalDepositBalance = depositBalance; // Deposit balance doesn't decrease with withdrawals
      const finalTotalBalance = finalDepositBalance + finalRewardBalance;
      
      // Update user with calculated balances
      await User.findByIdAndUpdate(user._id, {
        $set: {
          balance: finalTotalBalance,
          depositBalance: finalDepositBalance,
          rewardBalance: finalRewardBalance
        }
      });
      
      console.log(`Updated ${user.email}: Total=${finalTotalBalance}, Deposit=${finalDepositBalance}, Reward=${finalRewardBalance}`);
      processedUsers++;
    }
    
    return NextResponse.json({
      message: 'Balance initialization completed successfully',
      processedUsers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Balance initialization error:', error);
    return NextResponse.json(
      { message: 'Balance initialization failed', error: error.message },
      { status: 500 }
    );
  }
}
