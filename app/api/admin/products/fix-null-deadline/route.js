import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
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
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    // Find all products with null or undefined deadlineDays
    const productsWithNullDeadline = await Product.find({
      $or: [
        { deadlineDays: null },
        { deadlineDays: undefined },
        { deadlineDays: { $exists: false } }
      ]
    });

    console.log('Found products with null deadline:', productsWithNullDeadline.length);

    // Update all products with null deadlineDays to 30 days
    const updateResult = await Product.updateMany(
      {
        $or: [
          { deadlineDays: null },
          { deadlineDays: undefined },
          { deadlineDays: { $exists: false } }
        ]
      },
      {
        $set: { deadlineDays: 30 }
      }
    );

    console.log('Update result:', updateResult);

    return NextResponse.json({
      message: 'Fixed products with null deadline',
      foundProducts: productsWithNullDeadline.length,
      updatedProducts: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Fix null deadline error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
