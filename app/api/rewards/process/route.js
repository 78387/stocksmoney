import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";

import Order from "@/models/Order";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST() {
  try {
    // ✅ DB CONNECT
    await connectDB();

    /* ================================
       🇮🇳 INDIA TIME (IST) LOGIC
    ================================= */
    const nowUTC = new Date();
    const istNow = new Date(
      nowUTC.getTime() + 5.5 * 60 * 60 * 1000
    );

    const todayIST = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      istNow.getDate()
    );

    /* ================================
       📦 FETCH ACTIVE ORDERS
    ================================= */
    const activeOrders = await Order.find({
      status: "active",
      expiryDate: { $gt: nowUTC },
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
      .lean();

    let processedRewards = 0;
    let totalRewardAmount = 0;

    /* ================================
       🔁 PROCESS EACH ORDER
    ================================= */
    for (const order of activeOrders) {
      // ❌ skip broken references
      if (!order.userId || !order.productId) continue;

      // normalize userId
      const userId =
        typeof order.userId === "object"
          ? order.userId._id
          : order.userId;

      /* -------------------------------
         ⏰ DAILY CHECK (IST)
      -------------------------------- */
      if (order.lastRewardDate) {
        const lastIST = new Date(
          new Date(order.lastRewardDate).getTime() +
            5.5 * 60 * 60 * 1000
        );

        const lastRewardDay = new Date(
          lastIST.getFullYear(),
          lastIST.getMonth(),
          lastIST.getDate()
        );

        if (lastRewardDay.getTime() === todayIST.getTime()) {
          continue; // already rewarded today
        }
      }

      /* -------------------------------
         💰 PRICE (Decimal128 SAFE)
      -------------------------------- */
      const productPrice = parseFloat(
        order.productId.price?.toString()
      );

      if (isNaN(productPrice) || productPrice <= 0) continue;

      // ✅ EXACT 5% DAILY
      const dailyReward = Number(
        (productPrice * 0.05).toFixed(2)
      );

      /* -------------------------------
         🔒 ATOMIC LOCK (NO DOUBLE PAY)
      -------------------------------- */
      const locked = await Order.updateOne(
        {
          _id: order._id,
          $or: [
            { lastRewardDate: { $exists: false } },
            {
              lastRewardDate: {
                $lt: todayIST,
              },
            },
          ],
        },
        {
          lastRewardDate: istNow,
          $inc: { rewardsGenerated: dailyReward },
        }
      );

      if (locked.modifiedCount === 0) continue;

      /* -------------------------------
         👤 CREDIT USER
      -------------------------------- */
      await User.updateOne(
        { _id: userId },
        {
          $inc: {
            balance: dailyReward,
            rewardBalance: dailyReward,
          },
        }
      );

      /* -------------------------------
         🧾 TRANSACTION LOG
      -------------------------------- */
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

    /* ================================
       ⌛ EXPIRE ORDERS
    ================================= */
    const expiredOrders = await Order.updateMany(
      {
        status: "active",
        expiryDate: { $lte: nowUTC },
      },
      { status: "expired" }
    );

    /* ================================
       ✅ RESPONSE
    ================================= */
    return NextResponse.json({
      success: true,
      activeOrders: activeOrders.length,
      todayRewards: {
        count: processedRewards,
        amount: totalRewardAmount.toFixed(2),
      },
      expiredOrders: expiredOrders.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Reward processing error:", error);

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
