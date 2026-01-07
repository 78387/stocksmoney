import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import Admin from '@/models/Admin';

export async function POST() {
  try {
    await connectDB();

    // Find the first admin
    const admin = await Admin.findOne();
    if (!admin) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    // Check if QR codes already exist
    const existingQRs = await QRCode.find({});
    if (existingQRs.length > 0) {
      return NextResponse.json({ 
        message: 'QR codes already exist',
        count: existingQRs.length,
        qrCodes: existingQRs.map(qr => ({
          name: qr.name,
          country: qr.country,
          paymentMethod: qr.paymentMethod
        }))
      });
    }

    // Create QR codes for both countries
    const qrCodes = [
      // Indian QR Codes
      {
        name: 'India Main Account',
        upiId: 'stocksmoney@paytm',
        qrImage: 'https://via.placeholder.com/200x200/F97316/FFFFFF?text=IN+QR+1',
        country: {
          code: 'IN',
          name: 'India',
          currency: 'INR'
        },
        paymentMethod: 'UPI',
        description: 'Primary Indian payment account for deposits',
        createdBy: admin._id,
        isActive: true
      },
      {
        name: 'India Secondary Account',
        upiId: 'payments@phonepe',
        qrImage: 'https://via.placeholder.com/200x200/059669/FFFFFF?text=IN+QR+2',
        country: {
          code: 'IN',
          name: 'India',
          currency: 'INR'
        },
        paymentMethod: 'UPI',
        description: 'Secondary Indian payment account',
        createdBy: admin._id,
        isActive: true
      },
      // UK QR Codes
      {
        name: 'UK Main Account',
        upiId: '',
        qrImage: 'https://via.placeholder.com/200x200/1E40AF/FFFFFF?text=UK+QR+1',
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '12345678',
          sortCode: '12-34-56',
          bankName: 'Barclays Bank',
          accountHolderName: 'StocksMoney UK Ltd'
        },
        description: 'Primary UK payment account for deposits',
        createdBy: admin._id,
        isActive: true
      },
      {
        name: 'UK Secondary Account',
        upiId: '',
        qrImage: 'https://via.placeholder.com/200x200/7C3AED/FFFFFF?text=UK+QR+2',
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '87654321',
          sortCode: '65-43-21',
          bankName: 'HSBC Bank',
          accountHolderName: 'StocksMoney UK Ltd'
        },
        description: 'Secondary UK payment account',
        createdBy: admin._id,
        isActive: true
      }
    ];

    const result = await QRCode.insertMany(qrCodes);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${result.length} QR codes`,
      qrCodes: result.map(qr => ({
        id: qr._id,
        name: qr.name,
        country: qr.country,
        paymentMethod: qr.paymentMethod
      }))
    });

  } catch (error) {
    console.error('Error setting up QR codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
