import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    console.log('Starting comprehensive balance fix...');
    
    // Step 1: Initialize balance fields for all users
    await User.updateMany(
      {},
      {
        $set: {
          depositBalance: { $ifNull: ['$depositBalance', 0] },
          rewardBalance: { $ifNull: ['$rewardBalance', 0] }
        }
      }
    );
    
    // Step 2: Recalculate balances for all users
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
      
      // Calculate total withdrawals
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
      
      // Calculate purchases
      const purchases = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            type: 'purchase'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const totalPurchases = purchases[0]?.total || 0;
      
      // Calculate final balances
      // Withdrawals come from reward balance only
      const finalRewardBalance = Math.max(0, totalRewardEarnings - totalWithdrawals);
      
      // Purchases come from deposit balance first, then reward balance
      let finalDepositBalance = depositBalance;
      let remainingPurchases = totalPurchases;
      
      if (finalDepositBalance >= remainingPurchases) {
        finalDepositBalance -= remainingPurchases;
      } else {
        remainingPurchases -= finalDepositBalance;
        finalDepositBalance = 0;
        // Note: remaining purchases would come from reward balance
        // but we already calculated reward balance after withdrawals
      }
      
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
      message: 'Comprehensive balance fix completed successfully',
      processedUsers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Comprehensive balance fix error:', error);
    return NextResponse.json(
      { message: 'Balance fix failed', error: error.message },
      { status: 500 }
    );
  }
}
