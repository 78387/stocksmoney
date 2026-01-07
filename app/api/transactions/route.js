import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import QRCode from '@/models/QRCode';
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

    const transactions = await Transaction.find({ userId: decoded.userId })
      .populate('qrCodeId', 'name upiId')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      transactions
    });

  } catch (error) {
    console.error('Transactions fetch error:', error);
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

    const contentType = request.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle deposit with file upload
      const formData = await request.formData();
      data = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        utr: formData.get('utr'),
        proofImage: formData.get('proofImage'),
        qrCodeId: formData.get('qrCodeId') // QR code ID from frontend
      };
    } else {
      // Handle withdraw with JSON
      data = await request.json();
    }

    const { type, amount, utr, proofImage, withdrawalDetails, qrCodeId } = data;

    if (!type || !amount) {
      return NextResponse.json(
        { message: 'Type and amount are required' },
        { status: 400 }
      );
    }

    if (type === 'deposit') {
      // Get user to check their country
      const user = await User.findById(decoded.userId);
      const minAmount = user?.country?.code === 'GB' ? 50 : 500;
      const currency = user?.country?.code === 'GB' ? 'GBP' : 'INR';
      const symbol = user?.country?.symbol || '₹';

      if (amount < minAmount) {
        return NextResponse.json(
          { message: `Minimum deposit amount is ${symbol}${minAmount}` },
          { status: 400 }
        );
      }

      if (!utr || !proofImage) {
        return NextResponse.json(
          { message: 'UTR and proof image are required for deposits' },
          { status: 400 }
        );
      }

      if (!qrCodeId) {
        return NextResponse.json(
          { message: 'QR code selection is required for deposits' },
          { status: 400 }
        );
      }

      // Verify QR code exists and is active
      const qrCode = await QRCode.findById(qrCodeId);
      if (!qrCode || !qrCode.isActive) {
        return NextResponse.json(
          { message: 'Invalid or inactive QR code' },
          { status: 400 }
        );
      }

      // Store the actual image data (base64)
      let imageData = proofImage;
      
      console.log('ProofImage type:', typeof proofImage);
      console.log('ProofImage constructor:', proofImage?.constructor?.name);
      console.log('ProofImage:', proofImage);
      
      // If it's a File object from FormData, convert to base64
      if (proofImage && typeof proofImage === 'object' && proofImage.constructor.name === 'File') {
        const buffer = await proofImage.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imageData = `data:${proofImage.type};base64,${base64}`;
        console.log('Converted to base64, length:', imageData.length);
      } else if (typeof proofImage === 'string' && proofImage.startsWith('data:')) {
        // Already a data URL
        imageData = proofImage;
        console.log('Already data URL, length:', imageData.length);
      } else {
        // Fallback for other cases
        imageData = proofImage;
        console.log('Using as-is:', imageData);
      }

      const transaction = new Transaction({
        userId: decoded.userId,
        type: 'deposit',
        amount,
        utr,
        proofImage: imageData,
        status: 'pending',
        qrCodeId: qrCode._id,
        qrCodeUsed: {
          name: qrCode.name,
          upiId: qrCode.upiId
        }
      });

      await transaction.save();

      return NextResponse.json({
        message: 'Deposit request submitted successfully',
        transaction
      }, { status: 201 });

    } else if (type === 'withdraw') {
      // Check minimum withdrawal amount
      if (amount < 300) {
        return NextResponse.json(
          { message: 'Minimum withdrawal amount is ₹300' },
          { status: 400 }
        );
      }

      if (!withdrawalDetails || (!withdrawalDetails.accountNumber && !withdrawalDetails.upiId)) {
        return NextResponse.json(
          { message: 'Bank details or UPI ID is required for withdrawals' },
          { status: 400 }
        );
      }

      // Check user balance
      const user = await User.findById(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      // Only allow withdrawal from reward balance
      if ((user.rewardBalance || 0) < amount) {
        return NextResponse.json(
          { message: 'Insufficient reward balance. You can only withdraw from reward earnings.' },
          { status: 400 }
        );
      }

      // Deduct amount from reward balance and total balance immediately
      await User.findByIdAndUpdate(decoded.userId, {
        $inc: { 
          balance: -amount,
          rewardBalance: -amount
        }
      });

      const transaction = new Transaction({
        userId: decoded.userId,
        type: 'withdraw',
        amount,
        withdrawalDetails,
        status: 'pending'
      });

      await transaction.save();

      return NextResponse.json({
        message: 'Withdrawal request submitted successfully',
        transaction
      }, { status: 201 });
    }

    return NextResponse.json(
      { message: 'Invalid transaction type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
