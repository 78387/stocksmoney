export async function POST() {
  try {
    await connectDB();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeOrders = await Order.find({
      status: "active",
      expiryDate: { $gt: now },
    })
      .populate("productId", "price name")
      .populate("userId", "_id");

    let processedRewards = 0;
    let totalRewardAmount = 0;

    for (const order of activeOrders) {
      // ❌ skip broken orders
      if (!order.userId || !order.productId) continue;

      // ✅ order-wise last reward check
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

      const productPrice = Number(order.productId.price);
      if (!productPrice || productPrice <= 0) continue;

      // ✅ EXACT 5% per order
      const dailyReward = Number((productPrice * 0.05).toFixed(2));

      // ✅ credit user
      await User.updateOne(
        { _id: order.userId._id },
        {
          $inc: {
            balance: dailyReward,
            rewardBalance: dailyReward,
          },
        }
      );

      // ✅ transaction per order
      await Transaction.create({
        userId: order.userId._id,
        type: "reward",
        amount: dailyReward,
        status: "completed",
        productId: order.productId._id,
        orderId: order._id,
        description: `Daily 5% reward for ${order.productId.name}`,
      });

      // ✅ update THIS order only
      await Order.updateOne(
        { _id: order._id },
        {
          lastRewardDate: now,
          $inc: { rewardsGenerated: dailyReward },
        }
      );

      processedRewards++;
      totalRewardAmount += dailyReward;
    }

    // ✅ expire orders
    const expiredOrders = await Order.updateMany(
      { status: "active", expiryDate: { $lte: now } },
      { status: "expired" }
    );

    return NextResponse.json({
      message: "Daily rewards processed successfully",
      processedRewards,
      totalRewardAmount: totalRewardAmount.toFixed(2),
      expiredOrders: expiredOrders.modifiedCount,
    });
  } catch (error) {
    console.error("Reward processing error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
