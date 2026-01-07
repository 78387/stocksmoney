import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral';

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

    // Find users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    let updatedCount = 0;
    const errors = [];

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
        } else {
          errors.push(`Failed to generate unique code for ${user.email}`);
        }
      } catch (error) {
        errors.push(`Error updating ${user.email}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Successfully generated referral codes for ${updatedCount} users`,
      updatedCount,
      totalUsers: usersWithoutCodes.length,
      errors
    });

  } catch (error) {
    console.error('Generate referral codes error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
