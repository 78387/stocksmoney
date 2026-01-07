import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request) {
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
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.status !== 'active') {
      return NextResponse.json(
        { message: 'Product is not available for purchase' },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { message: 'Insufficient stock' },
        { status: 400 }
      );
    }

    const totalAmount = product.price * quantity;

    // Get user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.balance < totalAmount) {
      return NextResponse.json(
        { message: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(expiryDate.getDate() + product.deadlineDays);

    // Create order
    const order = new Order({
      userId: decoded.userId,
      productId,
      quantity,
      price: totalAmount,
      purchaseDate,
      expiryDate,
      status: 'active',
      paymentMethod: 'wallet'
    });

    await order.save();

    // Deduct amount from user balance
    await User.findByIdAndUpdate(decoded.userId, {
      $inc: { balance: -totalAmount }
    });

    // Update product stock
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity }
    });

    // Create purchase transaction record
    const purchaseTransaction = new Transaction({
      userId: decoded.userId,
      type: 'purchase',
      amount: totalAmount,
      status: 'completed',
      productId,
      orderId: order._id,
      description: `Purchase of ${product.name}`
    });

    await purchaseTransaction.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'name description price image deadlineDays');

    const productPrice = Number(product.price) || 0;
    const deadlineDays = Number(product.deadlineDays) || 0;

    return NextResponse.json({
      message: 'Product purchased successfully',
      order: populatedOrder,
      rewardInfo: {
        dailyReward: productPrice * 0.1,
        totalRewards: productPrice * 0.1 * deadlineDays,
        rewardDays: deadlineDays,
        formula: `₹${productPrice} × 10% × ${deadlineDays} days = ₹${(productPrice * 0.1 * deadlineDays).toFixed(2)}`
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
