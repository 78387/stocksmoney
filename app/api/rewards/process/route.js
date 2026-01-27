import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

/**
 * POST → Process daily rewards (5%)
 * This should be triggered by a cron job
 */
export async function POST(request) {
  try {
    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all active & non-expired orders
    const activeOrders = await Order.find({
      status: 'active',
      expiryDate: { $gt: now }
    }).populate('productId', 'price name');

    let processedRewards = 0;
    let totalRewardAmount = 0;

    for (const order of activeOrders) {
      // Check if reward already given today
      const lastRewardDate = order.lastRewardDate
        ? new Date(order.lastRewardDate)
        : null;

      const lastRewardDay = lastRewardDate
        ? new Date(
            lastRewardDate.getFullYear(),
            lastRewardDate.getMonth(),
            lastRewardDate.getDate()
          )
        : null;

      if (lastRewardDay && lastRewardDay.getTime() === today.getTime()) {
        continue;
      }

      // 🔹 Calculate DAILY reward = 5%
      const productPrice = Number(order.productId?.price) || 0;
      const dailyReward = productPrice * 0.05;

      if (dailyReward <= 0) continue;

      // 🔹 Add reward to user wallet
      await User.findByIdAndUpdate(order.userId, {
        $inc: {
          balance: dailyReward,
          rewardBalance: dailyReward
        }
      });

      // 🔹 Create transaction record
      await Transaction.create({
        userId: order.userId,
        type: 'reward',
        amount: dailyReward,
        status: 'completed',
        productId: order.productId._id,
        orderId: order._id,
        description: `Daily 5% reward for ${order.productId.name}`
      });

      // 🔹 Update order
      await Order.findByIdAndUpdate(order._id, {
        lastRewardDate: now,
        $inc: { rewardsGenerated: dailyReward }
      });

      processedRewards++;
      totalRewardAmount += dailyReward;
    }

    // 🔹 Mark expired orders
    const expiredOrders = await Order.updateMany(
      {
        status: 'active',
        expiryDate: { $lte: now }
      },
      { status: 'expired' }
    );

    return NextResponse.json({
      success: true,
      message: 'Daily rewards processed successfully',
      processedRewards,
      totalRewardAmount: totalRewardAmount.toFixed(2),
      expiredOrders: expiredOrders.modifiedCount
    });
  } catch (error) {
    console.error('Reward processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET → Reward statistics
 */
export async function GET(request) {
  try {
    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Active orders
    const activeOrders = await Order.countDocuments({
      status: 'active',
      expiryDate: { $gt: now }
    });

    // Today's rewards
    const todayRewards = await Transaction.aggregate([
      {
        $match: {
          type: 'reward',
          createdAt: { $gte: today, $lt: tomorrow }
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

    // All-time rewards
    const totalRewards = await Transaction.aggregate([
      { $match: { type: 'reward' } },
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
      activeOrders,
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
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
