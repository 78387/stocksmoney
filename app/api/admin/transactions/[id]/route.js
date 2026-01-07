import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { getReferralBonus } from '@/lib/referral';

export async function PUT(request, { params }) {
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

    const { id } = params;
    const { status, reason } = await request.json();

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { message: 'Transaction has already been processed' },
        { status: 400 }
      );
    }

    // Update transaction
    transaction.status = status;
    transaction.reason = reason;
    transaction.processedAt = new Date();
    transaction.adminId = decoded.adminId;

    await transaction.save();

    // Handle balance updates based on transaction type and status
    if (transaction.type === 'deposit' && status === 'approved') {
      // Add money to user's deposit balance and total balance for approved deposits
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { 
          balance: transaction.amount,
          depositBalance: transaction.amount
        }
      });

      // Check if this is user's first deposit and process referral bonus
      const user = await User.findById(transaction.userId);
      if (user && user.referredBy) {
        // Check if this is the first approved deposit
        const previousDeposits = await Transaction.countDocuments({
          userId: transaction.userId,
          type: 'deposit',
          status: 'approved',
          _id: { $ne: transaction._id }
        });

        if (previousDeposits === 0) {
          // This is the first deposit, process referral bonus
          const referrerUser = await User.findOne({ referralCode: user.referredBy });
          
          if (referrerUser) {
            try {
              const bonusAmount = getReferralBonus();
              
              // Add bonus to referrer's reward balance and total balance
              await User.findByIdAndUpdate(referrerUser._id, {
                $inc: { 
                  balance: bonusAmount,
                  rewardBalance: bonusAmount
                }
              });

              // Create referral transaction
              const referralTransaction = new Transaction({
                userId: referrerUser._id,
                type: 'referral',
                amount: bonusAmount,
                status: 'completed',
                referralData: {
                  referredUserId: user._id,
                  referredUserName: user.name,
                  referredUserEmail: user.email
                }
              });

              await referralTransaction.save();

              console.log(`Referral bonus of ₹${bonusAmount} awarded to ${referrerUser.email} for ${user.email}'s first deposit`);
            } catch (referralError) {
              console.error('Error processing referral bonus:', referralError);
              // Don't fail the deposit approval if referral bonus fails
            }
          }
        }
      }
    } else if (transaction.type === 'withdraw' && status === 'rejected') {
      // Refund money to user's reward balance and total balance for rejected withdrawals
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { 
          balance: transaction.amount,
          rewardBalance: transaction.amount
        }
      });
    }

    const updatedTransaction = await Transaction.findById(id)
      .populate('userId', 'name email');

    return NextResponse.json({
      message: `Transaction ${status} successfully`,
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Admin transaction update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
