import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, countryCode, qrImage, paymentMethod, bankDetails } = await request.json();
    
    // Create QR code directly without model validation
    const qrData = {
      name,
      qrImage,
      country: {
        code: countryCode,
        name: countryCode === 'IN' ? 'India' : 'United Kingdom',
        currency: countryCode === 'IN' ? 'INR' : 'GBP'
      },
      paymentMethod: paymentMethod || (countryCode === 'IN' ? 'UPI' : 'Bank Transfer'),
      bankDetails: bankDetails || {},
      isActive: true,
      totalDeposits: 0,
      totalTransactions: 0,
      createdBy: new mongoose.Types.ObjectId(),
      description: '',
      upiId: '' // Always set to empty string
    };
    
    // Insert directly into collection
    const db = mongoose.connection.db;
    const result = await db.collection('qrcodes').insertOne(qrData);
    
    return NextResponse.json({
      success: true,
      message: 'QR code created successfully',
      id: result.insertedId
    });
    
  } catch (error) {
    console.error('Quick fix error:', error);
    return NextResponse.json(
      { message: 'Error', error: error.message },
      { status: 500 }
    );
  }
}
