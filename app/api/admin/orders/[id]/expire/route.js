import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

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

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status === 'expired') {
      return NextResponse.json(
        { message: 'Order is already expired' },
        { status: 400 }
      );
    }

    // Force expire the order
    await Order.findByIdAndUpdate(id, {
      status: 'expired',
      expiryDate: new Date() // Set expiry date to now
    });

    return NextResponse.json({
      message: 'Order expired successfully'
    });

  } catch (error) {
    console.error('Order expire error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
