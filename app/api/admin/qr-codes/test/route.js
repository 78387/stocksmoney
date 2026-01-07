import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';

export async function GET() {
  try {
    console.log('Test API called');
    await connectDB();
    console.log('Database connected');
    
    const qrCodes = await QRCode.find({});
    console.log('QR codes found:', qrCodes.length);
    
    return NextResponse.json({
      success: true,
      message: 'Test API working',
      count: qrCodes.length,
      qrCodes: qrCodes
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
