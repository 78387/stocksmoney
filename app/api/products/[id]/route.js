import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.status !== 'active') {
      return NextResponse.json(
        { message: 'Product is not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
