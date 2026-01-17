import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    // This endpoint should be called by a cron job or scheduled task
    // For demo purposes, we'll allow manual triggering
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find all active orders that haven't expired
    const activeOrders = await Order.find({
      status: 'active',
      expiryDate: { $gt: now }
    }).populate('productId', 'price name');

    let processedRewards = 0;
    let totalRewardAmount = 0;

    for (const order of activeOrders) {
      // Check if reward was already processed today
      const lastRewardDate = order.lastRewardDate ? new Date(order.lastRewardDate) : null;
      const lastRewardDay = lastRewardDate ? new Date(lastRewardDate.getFullYear(), lastRewardDate.getMonth(), lastRewardDate.getDate()) : null;
      
      // Skip if reward already processed today
      if (lastRewardDay && lastRewardDay.getTime() === today.getTime()) {
        continue;
      }

      // Calculate daily reward (5% of product price)
      const productPrice = Number(order.productId?.price) || 0;
      const dailyReward = productPrice * 0.05;
      
      // Add reward to user's wallet
      await User.findByIdAndUpdate(order.userId, {
        $inc: { 
          balance: dailyReward,
          rewardBalance: dailyReward
        }
      });

      // Create reward transaction
      const rewardTransaction = new Transaction({
        userId: order.userId,
        type: 'reward',
        amount: dailyReward,
        status: 'completed',
        productId: order.productId._id,
        orderId: order._id,
        description: `Daily reward for ${order.productId.name}`
      });

      await rewardTransaction.save();

      // Update order with last reward date and increment rewards generated
      await Order.findByIdAndUpdate(order._id, {
        lastRewardDate: now,
        $inc: { rewardsGenerated: dailyReward }
      });

      processedRewards++;
      totalRewardAmount += dailyReward;
    }

    // Update expired orders status
    const expiredOrders = await Order.updateMany(
      {
        status: 'active',
        expiryDate: { $lte: now }
      },
      {
        status: 'expired'
      }
    );

    return NextResponse.json({
      message: 'Rewards processed successfully',
      processedRewards,
      totalRewardAmount: totalRewardAmount.toFixed(2),
      expiredOrders: expiredOrders.modifiedCount
    });

  } catch (error) {
    console.error('Reward processing error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get reward statistics
export async function GET(request) {
  try {
    await connectDB();
    
    const now = new Date();
    
    // Get active orders count
    const activeOrdersCount = await Order.countDocuments({
      status: 'active',
      expiryDate: { $gt: now }
    });

    // Get total rewards distributed today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRewards = await Transaction.aggregate([
      {
        $match: {
          type: 'reward',
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total rewards distributed all time
    const totalRewards = await Transaction.aggregate([
      {
        $match: {
          type: 'reward'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      activeOrders: activeOrdersCount,
      todayRewards: {
        amount: todayRewards[0]?.totalAmount || 0,
        count: todayRewards[0]?.count || 0
      },
      totalRewards: {
        amount: totalRewards[0]?.totalAmount || 0,
        count: totalRewards[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Reward stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
