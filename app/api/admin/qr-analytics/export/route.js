import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import Transaction from '@/models/Transaction';
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

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const days = searchParams.get('days');

    // Build date filter
    let dateFilter = {};
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      dateFilter = { createdAt: { $gte: daysAgo } };
    }

    // Build country filter for QR codes
    let qrFilter = {};
    if (country && ['IN', 'GB'].includes(country)) {
      qrFilter['country.code'] = country;
    }

    // Get all QR codes with country filter
    const qrCodes = await QRCode.find(qrFilter).sort({ createdAt: -1 });

    // Prepare CSV data
    const csvData = [];
    
    // Add header
    csvData.push([
      'QR Code Name',
      'Country',
      'Currency',
      'Payment Method',
      'Total Deposits',
      'Total Transactions',
      'Average Amount',
      'Status',
      'Created Date',
      'Last Used',
      'UPI ID',
      'Bank Details'
    ]);

    // Process each QR code
    for (const qr of qrCodes) {
      // Get transactions for this QR code
      const transactionFilter = {
        qrCodeId: qr._id,
        status: { $in: ['approved', 'completed'] },
        ...dateFilter
      };

      const transactions = await Transaction.find(transactionFilter);
      const totalDeposits = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalTransactions = transactions.length;
      const averageAmount = totalTransactions > 0 ? totalDeposits / totalTransactions : 0;

      // Format bank details
      let bankDetails = '';
      if (qr.bankDetails) {
        const details = [];
        if (qr.bankDetails.accountNumber) details.push(`Acc: ${qr.bankDetails.accountNumber}`);
        if (qr.bankDetails.ifscCode) details.push(`IFSC: ${qr.bankDetails.ifscCode}`);
        if (qr.bankDetails.sortCode) details.push(`Sort: ${qr.bankDetails.sortCode}`);
        if (qr.bankDetails.bankName) details.push(`Bank: ${qr.bankDetails.bankName}`);
        bankDetails = details.join(', ');
      }

      csvData.push([
        qr.name,
        `${qr.country.code} - ${qr.country.name}`,
        qr.country.currency,
        qr.paymentMethod,
        totalDeposits,
        totalTransactions,
        averageAmount.toFixed(2),
        qr.isActive ? 'Active' : 'Inactive',
        new Date(qr.createdAt).toLocaleDateString(),
        qr.lastUsed ? new Date(qr.lastUsed).toLocaleDateString() : 'Never',
        qr.upiId || 'N/A',
        bankDetails || 'N/A'
      ]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Return CSV file
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="qr_analytics_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('QR analytics export error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
