import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
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
    const { name, description, price, deadlineDays, category, image, status } = await request.json();

    if (!name || !description || !price || !deadlineDays) {
      return NextResponse.json(
        { message: 'Name, description, price, and deadline days are required' },
        { status: 400 }
      );
    }

    if (price <= 0 || deadlineDays <= 0) {
      return NextResponse.json(
        { message: 'Price and deadline days must be greater than 0' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price: Number(price),
        deadlineDays: Number(deadlineDays),
        category,
        image,
        status
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
