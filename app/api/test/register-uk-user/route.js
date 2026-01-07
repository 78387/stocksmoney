import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { generateReferralCode } from '@/lib/referral';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, password } = await request.json();

    console.log('Test UK user registration:', { name, email });

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Force UK country for testing
    const ukCountry = {
      code: 'GB',
      name: 'United Kingdom',
      currency: 'GBP',
      symbol: '£'
    };

    // Create new user with UK country
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      country: ukCountry,
      ipAddress: '192.168.1.1' // Mock UK IP
    });

    // Generate referral code
    let newUserReferralCode;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      newUserReferralCode = generateReferralCode(name, newUser._id.toString());
      
      if (attempts > 0) {
        newUserReferralCode += Math.floor(Math.random() * 100);
      }
      
      const existingCode = await User.findOne({ referralCode: newUserReferralCode });
      if (!existingCode) break;
      
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts < maxAttempts) {
      newUser.referralCode = newUserReferralCode;
    }

    await newUser.save();

    console.log(`Test UK user registered: ${newUser.email} (${ukCountry.name})`);

    return NextResponse.json(
      { 
        message: 'UK test user registered successfully',
        referralCode: newUser.referralCode,
        country: ukCountry,
        userId: newUser._id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Test UK registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
