import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import Admin from '@/models/Admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await connectDB();
    
    // Check if QR codes already exist
    const existingQRCodes = await QRCode.countDocuments();
    
    if (existingQRCodes > 0) {
      return NextResponse.json({
        message: 'QR codes already exist',
        count: existingQRCodes
      });
    }

    // Find or create admin user
    let admin = await Admin.findOne({ email: 'admin@stocksmoney.com' });
    if (!admin) {
      // Create default admin if doesn't exist
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      admin = new Admin({
        name: 'System Admin',
        email: 'admin@stocksmoney.com',
        password: hashedPassword
      });
      await admin.save();
    }

    // Sample QR codes for both countries
    const sampleQRCodes = [
      // India QR Codes
      {
        name: 'Main India UPI',
        upiId: 'stocksmoney@paytm',
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Placeholder
        country: {
          code: 'IN',
          name: 'India',
          currency: 'INR'
        },
        paymentMethod: 'UPI',
        description: 'Primary UPI QR code for Indian users',
        createdBy: admin._id,
        isActive: true
      },
      {
        name: 'Secondary India UPI',
        upiId: 'backup@phonepe',
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Placeholder
        country: {
          code: 'IN',
          name: 'India',
          currency: 'INR'
        },
        paymentMethod: 'UPI',
        description: 'Backup UPI QR code for Indian users',
        createdBy: admin._id,
        isActive: true
      },
      {
        name: 'India Bank Transfer',
        upiId: '',
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Placeholder
        country: {
          code: 'IN',
          name: 'India',
          currency: 'INR'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          accountHolderName: 'StocksMoney India Pvt Ltd'
        },
        description: 'Bank transfer details for Indian users',
        createdBy: admin._id,
        isActive: true
      },
      
      // UK QR Codes
      {
        name: 'Main UK Bank Transfer',
        upiId: '',
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Placeholder
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          accountNumber: '12345678',
          sortCode: '12-34-56',
          bankName: 'Barclays Bank UK PLC',
          accountHolderName: 'StocksMoney UK Ltd'
        },
        description: 'Primary bank transfer for UK users',
        createdBy: admin._id,
        isActive: true
      },
      {
        name: 'UK PayPal',
        upiId: '',
        qrImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Placeholder
        country: {
          code: 'GB',
          name: 'United Kingdom',
          currency: 'GBP'
        },
        paymentMethod: 'PayPal',
        bankDetails: {
          accountHolderName: 'payments@stocksmoney.co.uk'
        },
        description: 'PayPal payment option for UK users',
        createdBy: admin._id,
        isActive: true
      }
    ];

    await QRCode.insertMany(sampleQRCodes);
    
    return NextResponse.json({
      message: 'Sample QR codes created successfully',
      count: sampleQRCodes.length,
      qrCodes: sampleQRCodes.map(qr => ({
        name: qr.name,
        country: qr.country,
        paymentMethod: qr.paymentMethod
      }))
    });

  } catch (error) {
    console.error('QR codes initialization error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
