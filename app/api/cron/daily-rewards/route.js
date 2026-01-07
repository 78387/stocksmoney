import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    console.log('Starting daily reward processing at:', new Date().toISOString());
    
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
        console.log(`Reward already processed today for order ${order._id}`);
        continue;
      }

      // Calculate daily reward (20% of product price)
      const productPrice = Number(order.productId?.price) || 0;
      const dailyReward = productPrice * 0.2;
      
      if (dailyReward <= 0) {
        console.log(`Invalid reward amount for order ${order._id}: ${dailyReward}`);
        continue;
      }

      // Add reward to user's reward balance and total balance
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
        description: `Daily reward (20%) for ${order.productId.name}`
      });

      await rewardTransaction.save();

      // Update order with last reward date and increment rewards generated
      await Order.findByIdAndUpdate(order._id, {
        lastRewardDate: now,
        $inc: { rewardsGenerated: dailyReward }
      });

      console.log(`Processed reward: ₹${dailyReward} for user ${order.userId} from product ${order.productId.name}`);
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

    console.log('Daily reward processing completed:', {
      processedRewards,
      totalRewardAmount: totalRewardAmount.toFixed(2),
      expiredOrders: expiredOrders.modifiedCount,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Daily rewards processed successfully',
      data: {
        processedRewards,
        totalRewardAmount: totalRewardAmount.toFixed(2),
        expiredOrders: expiredOrders.modifiedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Daily reward processing error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Daily reward processing failed', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET method to check status
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

    return NextResponse.json({
      success: true,
      data: {
        activeOrders: activeOrdersCount,
        todayRewards: {
          amount: todayRewards[0]?.totalAmount || 0,
          count: todayRewards[0]?.count || 0
        },
        lastCheck: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Reward status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Status check failed', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
