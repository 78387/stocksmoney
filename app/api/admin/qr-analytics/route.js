import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import Transaction from '@/models/Transaction';
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

    // Get transactions for each QR code with date filter
    const qrAnalytics = await Promise.all(
      qrCodes.map(async (qr) => {
        // Build transaction filter
        const transactionFilter = {
          qrCodeId: qr._id,
          status: { $in: ['approved', 'completed'] },
          ...dateFilter
        };

        // Get transactions for this QR code
        const transactions = await Transaction.find(transactionFilter)
          .populate('userId', 'name email')
          .sort({ createdAt: -1 });

        // Calculate totals
        const totalDeposits = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalTransactions = transactions.length;

        // Get recent transactions (last 5)
        const recentTransactions = transactions.slice(0, 5).map(t => ({
          amount: t.amount,
          date: t.createdAt,
          userId: t.userId?._id,
          userName: t.userId?.name || 'Unknown User'
        }));

        // Get monthly stats for the last 6 months
        const monthlyStats = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i, 1);
          monthStart.setHours(0, 0, 0, 0);
          
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);

          const monthTransactions = await Transaction.find({
            qrCodeId: qr._id,
            status: { $in: ['approved', 'completed'] },
            createdAt: { $gte: monthStart, $lte: monthEnd }
          });

          monthlyStats.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            deposits: monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            transactions: monthTransactions.length
          });
        }

        return {
          _id: qr._id,
          name: qr.name,
          country: qr.country,
          paymentMethod: qr.paymentMethod,
          totalDeposits,
          totalTransactions,
          isActive: qr.isActive,
          lastUsed: qr.lastUsed,
          createdAt: qr.createdAt,
          recentTransactions,
          monthlyStats
        };
      })
    );

    // Calculate country-wise statistics
    const countryStatsMap = new Map();
    
    qrAnalytics.forEach(qr => {
      const countryCode = qr.country.code;
      if (!countryStatsMap.has(countryCode)) {
        countryStatsMap.set(countryCode, {
          country: qr.country.name,
          code: countryCode,
          currency: qr.country.currency,
          symbol: countryCode === 'IN' ? '₹' : '£',
          totalDeposits: 0,
          totalTransactions: 0,
          activeQRs: 0,
          totalQRs: 0
        });
      }
      
      const stats = countryStatsMap.get(countryCode);
      stats.totalDeposits += qr.totalDeposits;
      stats.totalTransactions += qr.totalTransactions;
      stats.totalQRs += 1;
      if (qr.isActive) stats.activeQRs += 1;
    });

    const countryStats = Array.from(countryStatsMap.values());

    return NextResponse.json({
      success: true,
      qrAnalytics: qrAnalytics.sort((a, b) => b.totalDeposits - a.totalDeposits),
      countryStats,
      summary: {
        totalQRCodes: qrAnalytics.length,
        totalDeposits: qrAnalytics.reduce((sum, qr) => sum + qr.totalDeposits, 0),
        totalTransactions: qrAnalytics.reduce((sum, qr) => sum + qr.totalTransactions, 0),
        activeQRCodes: qrAnalytics.filter(qr => qr.isActive).length
      }
    });

  } catch (error) {
    console.error('QR analytics fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
