import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST() {
  try {
    await connectDB();

    const now = new Date();

    // normalize today's date (00:00:00)
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // fetch only valid active orders
    const activeOrders = await Order.find({
      status: "active",
      expiryDate: { $gt: now },
    })
      .populate({
        path: "productId",
        select: "price name",
        strictPopulate: false,
      })
      .populate({
        path: "userId",
        select: "_id",
        strictPopulate: false,
      })
      .lean(); // 🔥 prevents mongoose mutation bugs

    let processedRewards = 0;
    let totalRewardAmount = 0;

    for (const order of activeOrders) {
      // ❌ skip broken relations
      if (!order.userId || !order.productId) continue;

      // normalize userId
      const userId =
        typeof order.userId === "object"
          ? order.userId._id
          : order.userId;

      // last reward check (order-wise)
      if (order.lastRewardDate) {
        const last = new Date(order.lastRewardDate);
        const lastDay = new Date(
          last.getFullYear(),
          last.getMonth(),
          last.getDate()
        );

        if (lastDay.getTime() === today.getTime()) {
          continue; // already rewarded today
        }
      }

      // safe price parsing (Decimal128 safe)
      const productPrice = parseFloat(
        order.productId.price?.toString()
      );

      if (isNaN(productPrice) || productPrice <= 0) continue;

      // EXACT 5% daily reward
      const dailyReward = Number(
        (productPrice * 0.05).toFixed(2)
      );

      // 🔒 atomic order lock (prevents double reward)
      const locked = await Order.updateOne(
        {
          _id: order._id,
          $or: [
            { lastRewardDate: { $exists: false } },
            { lastRewardDate: { $lt: today } },
          ],
        },
        {
          lastRewardDate: now,
          $inc: { rewardsGenerated: dailyReward },
        }
      );

      if (locked.modifiedCount === 0) continue;

      // credit user wallet
      await User.updateOne(
        { _id: userId },
        {
          $inc: {
            balance: dailyReward,
            rewardBalance: dailyReward,
          },
        }
      );

      // record transaction
      await Transaction.create({
        userId,
        type: "reward",
        amount: dailyReward,
        status: "completed",
        productId: order.productId._id,
        orderId: order._id,
        description: `Daily 5% reward for ${order.productId.name}`,
      });

      processedRewards++;
      totalRewardAmount += dailyReward;
    }

    // expire old orders
    const expiredOrders = await Order.updateMany(
      { status: "active", expiryDate: { $lte: now } },
      { status: "expired" }
    );

    return NextResponse.json({
      success: true,
      message: "Daily rewards processed successfully",
      processedRewards,
      totalRewardAmount: totalRewardAmount.toFixed(2),
      expiredOrders: expiredOrders.modifiedCount,
    });
  } catch (error) {
    console.error("Reward processing error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
