import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Create CSV content
    const csvHeaders = [
      'ID',
      'Name',
      'Email',
      'Balance',
      'Status',
      'Online',
      'Account Number',
      'IFSC Code',
      'Bank Name',
      'Account Holder',
      'UPI ID',
      'Created At',
      'Last Login'
    ];

    const csvRows = users.map(user => [
      user._id,
      user.name,
      user.email,
      user.balance,
      user.status,
      user.isOnline ? 'Yes' : 'No',
      user.bankDetails?.accountNumber || '',
      user.bankDetails?.ifscCode || '',
      user.bankDetails?.bankName || '',
      user.bankDetails?.accountHolderName || '',
      user.bankDetails?.upiId || '',
      new Date(user.createdAt).toISOString(),
      user.lastLogin ? new Date(user.lastLogin).toISOString() : ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Admin users export error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
