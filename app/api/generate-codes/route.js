import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateReferralCode } from '@/lib/referral';

export async function POST(request) {
  try {
    await connectDB();
    
    // Find users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    let updatedCount = 0;

    for (const user of usersWithoutCodes) {
      try {
        let referralCode;
        let attempts = 0;
        const maxAttempts = 5;

        do {
          referralCode = generateReferralCode(user.name, user._id.toString());
          
          if (attempts > 0) {
            referralCode += Math.floor(Math.random() * 100);
          }
          
          const existingUser = await User.findOne({ referralCode });
          if (!existingUser) break;
          
          attempts++;
        } while (attempts < maxAttempts);

        if (attempts < maxAttempts) {
          user.referralCode = referralCode;
          await user.save();
          updatedCount++;
          console.log(`Generated referral code ${referralCode} for ${user.email}`);
        }
      } catch (error) {
        console.error(`Error updating ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      message: `Successfully generated referral codes for ${updatedCount} users`,
      updatedCount,
      totalUsers: usersWithoutCodes.length
    });

  } catch (error) {
    console.error('Generate codes error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
