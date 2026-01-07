import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateReferralCode } from '@/lib/referral';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get all users
    const allUsers = await User.find({}).select('name email referralCode');
    
    // Count users with and without referral codes
    const usersWithCodes = allUsers.filter(user => user.referralCode);
    const usersWithoutCodes = allUsers.filter(user => !user.referralCode);

    return NextResponse.json({
      totalUsers: allUsers.length,
      usersWithCodes: usersWithCodes.length,
      usersWithoutCodes: usersWithoutCodes.length,
      usersWithCodesData: usersWithCodes,
      usersWithoutCodesData: usersWithoutCodes
    });

  } catch (error) {
    console.error('Check referrals error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    console.log('Starting referral code generation for all users...');
    
    // Find all users without referral codes
    const usersWithoutCodes = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: '' }
      ]
    });

    console.log(`Found ${usersWithoutCodes.length} users without referral codes`);

    let updatedCount = 0;
    const errors = [];

    for (const user of usersWithoutCodes) {
      try {
        console.log(`Generating code for user: ${user.email}`);
        
        let referralCode;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          referralCode = generateReferralCode(user.name, user._id.toString());
          
          // Add random suffix if code already exists
          if (attempts > 0) {
            referralCode += Math.floor(Math.random() * 1000);
          }
          
          const existingUser = await User.findOne({ referralCode });
          if (!existingUser) break;
          
          attempts++;
          console.log(`Attempt ${attempts}: Code ${referralCode} already exists, trying again...`);
        } while (attempts < maxAttempts);

        if (attempts < maxAttempts) {
          // Update user with referral code
          await User.findByIdAndUpdate(user._id, { referralCode });
          updatedCount++;
          console.log(`✅ Generated code ${referralCode} for ${user.email}`);
        } else {
          const error = `Failed to generate unique code for ${user.email} after ${maxAttempts} attempts`;
          errors.push(error);
          console.error(`❌ ${error}`);
        }
      } catch (error) {
        const errorMsg = `Error updating ${user.email}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ Successfully generated referral codes for ${updatedCount} users`);
    
    // Get updated stats
    const allUsers = await User.find({}).select('name email referralCode');
    const usersWithCodes = allUsers.filter(user => user.referralCode);

    return NextResponse.json({
      message: `Successfully generated referral codes for ${updatedCount} users`,
      updatedCount,
      totalUsers: usersWithoutCodes.length,
      errors,
      finalStats: {
        totalUsers: allUsers.length,
        usersWithCodes: usersWithCodes.length,
        usersWithoutCodes: allUsers.length - usersWithCodes.length
      }
    });

  } catch (error) {
    console.error('Generate referral codes error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
