import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Commission from '@/models/Commission';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
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

    // Get user to determine country
    const user = await User.findById(decoded.userId);
    const userCountry = user?.country?.code || 'IN';

    // Get platform commission
    const platformCommission = await Commission.findOne({ type: 'platform', isActive: true });
    const defaultCommissionRate = platformCommission?.rate || 0;

    const orders = await Order.find({ userId: decoded.userId })
      .populate('productId', 'name description price pricing image deadlineDays dailyCommission commissionRate')
      .sort({ createdAt: -1 });

    // Filter active orders and calculate earnings
    const activeOrders = orders.filter(order => {
      const expiryDate = new Date(order.expiryDate);
      return expiryDate > new Date();
    }).map(order => {
      // Calculate days since purchase
      const purchaseDate = new Date(order.purchaseDate);
      const today = new Date();
      const daysPassed = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
      
      // Get price for user's country
      const productPricing = order.productId.pricing?.[userCountry] || 
                           order.productId.pricing?.INR || 
                           { price: order.productId.price || 0, symbol: '₹' };
      
      // Calculate commission - use product-specific rate or platform default
      const commissionRate = order.productId.commissionRate || defaultCommissionRate;
      const purchaseAmount = order.totalAmount || productPricing.price;
      const dailyCommissionAmount = (purchaseAmount * commissionRate) / 100 / (order.productId.deadlineDays || 30);
      const totalEarnings = daysPassed * dailyCommissionAmount;
      
      return {
        ...order.toObject(),
        price: productPricing.price,
        commission: {
          rate: commissionRate,
          dailyAmount: dailyCommissionAmount,
          totalEarned: totalEarnings
        },
        rewardsGenerated: totalEarnings,
        productId: {
          ...order.productId.toObject(),
          dailyCommission: dailyCommissionAmount,
          commissionRate: commissionRate
        }
      };
    });

    return NextResponse.json({
      orders: activeOrders
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Create order
    const order = new Order({
      userId: decoded.userId,
      productId,
      quantity,
      totalAmount,
      status: 'completed',
      paymentMethod: 'wallet'
    });

    await order.save();

    // Update user balance
    await User.findByIdAndUpdate(decoded.userId, {
      $inc: { balance: -totalAmount }
    });

    // Update product stock
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -quantity }
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('productId', 'name description price image');

    return NextResponse.json({
      message: 'Order placed successfully',
      order: populatedOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
