import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get all users with referral codes
    const usersWithCodes = await User.find({ 
      referralCode: { $exists: true, $ne: null } 
    }).select('name email referralCode');

    return NextResponse.json({
      message: 'Users with referral codes',
      count: usersWithCodes.length,
      users: usersWithCodes
    });

  } catch (error) {
    console.error('Test referral error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
