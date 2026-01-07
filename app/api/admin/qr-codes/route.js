import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Get all QR codes
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    let query = {};
    if (country && ['IN', 'GB'].includes(country)) {
      query['country.code'] = country;
    }

    const qrCodes = await QRCode.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      qrCodes,
      total: qrCodes.length
    });

  } catch (error) {
    console.error('QR codes fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Create new QR code
export async function POST(request) {
  try {
    await connectDB();
    console.log('QR Code creation started');

    const requestData = await request.json();
    console.log('Request data:', requestData);

    const { 
      name, 
      upiId, 
      qrImage, 
      countryCode, 
      paymentMethod,
      bankDetails,
      description 
    } = requestData;

    if (!name || !qrImage || !countryCode) {
      console.log('Missing required fields:', { name: !!name, qrImage: !!qrImage, countryCode: !!countryCode });
      return NextResponse.json(
        { message: 'Name, QR image, and country are required' },
        { status: 400 }
      );
    }

    if (!['IN', 'GB'].includes(countryCode)) {
      console.log('Invalid country code:', countryCode);
      return NextResponse.json(
        { message: 'Invalid country code. Must be IN or GB' },
        { status: 400 }
      );
    }

    // Set country information
    const countryInfo = {
      IN: { name: 'India', currency: 'INR' },
      GB: { name: 'United Kingdom', currency: 'GBP' }
    };

    console.log('Creating QR code with country:', countryCode);

    // Create a default admin ID if needed
    const defaultAdminId = new mongoose.Types.ObjectId();

    // Prepare QR code data with explicit upiId handling
    const qrCodeData = {
      name,
      qrImage,
      country: {
        code: countryCode,
        name: countryInfo[countryCode].name,
        currency: countryInfo[countryCode].currency
      },
      paymentMethod: paymentMethod || (countryCode === 'IN' ? 'UPI' : 'Bank Transfer'),
      bankDetails: bankDetails || {},
      description: description || '',
      createdBy: defaultAdminId,
      isActive: true,
      totalDeposits: 0,
      totalTransactions: 0
    };

    // Only add upiId if it's provided and not empty
    if (upiId && upiId.trim() !== '') {
      qrCodeData.upiId = upiId.trim();
    }

    console.log('QR Code data to save:', qrCodeData);

    // Create QR code without validation on upiId
    const newQRCode = new QRCode(qrCodeData);
    
    // Skip validation for upiId field
    newQRCode.$ignore('upiId');
    
    const savedQRCode = await newQRCode.save({ validateBeforeSave: false });
    
    console.log('QR Code saved successfully:', savedQRCode._id);

    return NextResponse.json({
      success: true,
      message: 'QR code created successfully',
      qrCode: savedQRCode
    }, { status: 201 });

  } catch (error) {
    console.error('QR code creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: validationErrors,
          details: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error.message, details: error.stack },
      { status: 500 }
    );
  }
}

// Update QR code
export async function PUT(request) {
  try {
    await connectDB();

    const { 
      id,
      name, 
      upiId, 
      qrImage, 
      countryCode, 
      paymentMethod,
      bankDetails,
      description 
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'QR code ID is required' },
        { status: 400 }
      );
    }

    const countryInfo = {
      IN: { name: 'India', currency: 'INR' },
      GB: { name: 'United Kingdom', currency: 'GBP' }
    };

    const updateData = {};
    if (name) updateData.name = name;
    if (upiId !== undefined) updateData.upiId = upiId || '';
    if (qrImage) updateData.qrImage = qrImage;
    if (countryCode) {
      updateData.country = {
        code: countryCode,
        name: countryInfo[countryCode].name,
        currency: countryInfo[countryCode].currency
      };
    }
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (bankDetails) updateData.bankDetails = bankDetails;
    if (description !== undefined) updateData.description = description;

    const updatedQRCode = await QRCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedQRCode) {
      return NextResponse.json(
        { message: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'QR code updated successfully',
      qrCode: updatedQRCode
    });

  } catch (error) {
    console.error('QR code update error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Delete QR code
export async function DELETE(request) {
  try {
    await connectDB();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'QR code ID is required' },
        { status: 400 }
      );
    }

    const deletedQRCode = await QRCode.findByIdAndDelete(id);

    if (!deletedQRCode) {
      return NextResponse.json(
        { message: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'QR code deleted successfully'
    });

  } catch (error) {
    console.error('QR code deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
