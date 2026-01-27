import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

/**
 * POST → Process daily rewards (5%)
 * Call via cron or manually
 */
export async function POST() {
  try {
    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeOrders = await Order.find({
      status: 'active',
      expiryDate: { $gt: now }
    }).populate('productId', 'price name');

    let processedRewards = 0;
    let totalRewardAmount = 0;

    for (const order of activeOrders) {
      try {
        // 🔒 Safety checks
        if (!order.userId) continue;
        if (!order.productId || !order.productId.price) continue;

        // ⛔ Skip if reward already processed today
        if (order.lastRewardDate) {
          const last = new Date(order.lastRewardDate);
          const lastDay = new Date(
            last.getFullYear(),
            last.getMonth(),
            last.getDate()
          );

          if (lastDay.getTime() === today.getTime()) continue;
        }

        // 💰 Calculate 5% reward
        const productPrice = parseFloat(order.productId.price);
        if (isNaN(productPrice) || productPrice <= 0) continue;

        const dailyReward = productPrice * 0.05;

        // 👤 Update user wallet
        await User.findByIdAndUpdate(order.userId, {
          $inc: {
            balance: dailyReward,
            rewardBalance: dailyReward // ensure this exists in User schema
          }
        });

        // 🧾 Create transaction
        await Transaction.create({
          userId: order.userId,
          type: 'reward',
          amount: dailyReward,
          status: 'completed',
          productId: order.productId._id,
          orderId: order._id,
          description: `Daily 5% reward`
        });

        // 📦 Update order
        await Order.findByIdAndUpdate(order._id, {
          lastRewardDate: now,
          $inc: { rewardsGenerated: dailyReward }
        });

        processedRewards++;
        totalRewardAmount += dailyReward;

      } catch (orderError) {
        console.error(`Reward failed for order ${order._id}`, orderError.message);
        continue;
      }
    }

    // ⏰ Mark expired orders
    const expiredOrders = await Order.updateMany(
      { status: 'active', expiryDate: { $lte: now } },
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
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeOrders = await Order.countDocuments({
      status: 'active',
      expiryDate: { $gt: now }
    });

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
