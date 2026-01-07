import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import QRCode from '@/models/QRCode';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
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
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = {};
    if (type && ['deposit', 'withdraw'].includes(type)) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .populate('qrCodeId', 'name upiId')
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      transactions
    });

  } catch (error) {
    console.error('Admin transactions fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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

    const { transactionId, status, reason } = await request.json();

    if (!transactionId || !status) {
      return NextResponse.json(
        { message: 'Transaction ID and status are required' },
        { status: 400 }
      );
    }

    const transaction = await Transaction.findById(transactionId)
      .populate('qrCodeId');

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { message: 'Transaction has already been processed' },
        { status: 400 }
      );
    }

    // Update transaction
    transaction.status = status;
    transaction.reason = reason;
    transaction.adminId = decoded.adminId;
    transaction.processedAt = new Date();

    if (status === 'approved' && transaction.type === 'deposit') {
      // Add money to user balance
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { balance: transaction.amount }
      });

      // Update QR code statistics
      if (transaction.qrCodeId) {
        await QRCode.findByIdAndUpdate(transaction.qrCodeId, {
          $inc: { 
            totalDeposits: transaction.amount,
            totalTransactions: 1
          }
        });
      }
    } else if (status === 'rejected' && transaction.type === 'withdraw') {
      // Refund money to user balance (it was already deducted)
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { 
          balance: transaction.amount,
          rewardBalance: transaction.amount
        }
      });
    }

    await transaction.save();

    return NextResponse.json({
      message: `Transaction ${status} successfully`,
      transaction
    });

  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
