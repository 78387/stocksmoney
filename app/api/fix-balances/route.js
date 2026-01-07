import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    // Update all users to have default balance fields if they don't exist
    const result = await User.updateMany(
      {
        $or: [
          { depositBalance: { $exists: false } },
          { rewardBalance: { $exists: false } },
          { depositBalance: null },
          { rewardBalance: null }
        ]
      },
      {
        $set: {
          depositBalance: 0,
          rewardBalance: 0
        }
      }
    );
    
    return NextResponse.json({
      message: 'Balance fields initialized successfully',
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('Fix balances error:', error);
    return NextResponse.json(
      { message: 'Failed to fix balances', error: error.message },
      { status: 500 }
    );
  }
}
