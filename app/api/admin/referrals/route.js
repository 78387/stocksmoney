import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get all users with referral data
    const users = await User.find({
      $or: [
        { referralCode: { $exists: true, $ne: null } },
        { referredBy: { $exists: true, $ne: null } }
      ]
    })
    .select('name email referralCode referredBy createdAt status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get referral transactions
    const referralTransactions = await Transaction.find({ type: 'referral' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Calculate referral statistics
    const totalReferrals = await User.countDocuments({ 
      referredBy: { $exists: true, $ne: null } 
    });

    const totalReferralEarnings = await Transaction.aggregate([
      { $match: { type: 'referral' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const topReferrers = await User.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'referralCode',
          foreignField: 'referredBy',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          referralCount: { $size: '$referrals' }
        }
      },
      {
        $match: { referralCount: { $gt: 0 } }
      },
      {
        $sort: { referralCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: 1,
          email: 1,
          referralCode: 1,
          referralCount: 1
        }
      }
    ]);

    // Get referral earnings for top referrers
    const topReferrersWithEarnings = await Promise.all(
      topReferrers.map(async (referrer) => {
        const earnings = await Transaction.aggregate([
          { 
            $match: { 
              userId: referrer._id, 
              type: 'referral' 
            } 
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$amount' } 
            } 
          }
        ]);
        
        return {
          ...referrer,
          totalEarnings: earnings[0]?.total || 0
        };
      })
    );

    const totalUsers = await User.countDocuments({
      $or: [
        { referralCode: { $exists: true, $ne: null } },
        { referredBy: { $exists: true, $ne: null } }
      ]
    });

    return NextResponse.json({
      users,
      transactions: referralTransactions,
      statistics: {
        totalReferrals,
        totalReferralEarnings: totalReferralEarnings[0]?.total || 0,
        topReferrers: topReferrersWithEarnings
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Admin referrals error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Export referral data as CSV
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
    if (!decoded || !decoded.adminId) {
      return NextResponse.json(
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (action === 'export') {
      // Get all referral data for export
      const referralData = await User.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'referralCode',
            foreignField: 'referredBy',
            as: 'referrals'
          }
        },
        {
          $lookup: {
            from: 'transactions',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$type', 'referral'] }
                    ]
                  }
                }
              }
            ],
            as: 'referralTransactions'
          }
        },
        {
          $addFields: {
            referralCount: { $size: '$referrals' },
            totalEarnings: {
              $sum: '$referralTransactions.amount'
            }
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            referralCode: 1,
            referredBy: 1,
            referralCount: 1,
            totalEarnings: 1,
            createdAt: 1,
            status: 1
          }
        },
        {
          $sort: { referralCount: -1 }
        }
      ]);

      // Convert to CSV format
      const csvHeaders = [
        'Name',
        'Email', 
        'Referral Code',
        'Referred By',
        'Total Referrals',
        'Total Earnings',
        'Join Date',
        'Status'
      ];

      const csvRows = referralData.map(user => [
        user.name,
        user.email,
        user.referralCode || '',
        user.referredBy || '',
        user.referralCount,
        user.totalEarnings,
        new Date(user.createdAt).toLocaleDateString(),
        user.status
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="referral-data.csv"'
        }
      });
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin referrals export error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
