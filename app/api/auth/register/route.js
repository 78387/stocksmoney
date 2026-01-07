import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { generateReferralCode, isValidReferralCode } from '@/lib/referral';
import { detectCountryFromIP, getClientIP } from '@/lib/location';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, password, referralCode, country } = await request.json();

    console.log('Registration request:', { name, email, referralCode, country });

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
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

    // Use selected country from form
    let finalCountry;
    if (country === 'GB') {
      finalCountry = {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        symbol: '£'
      };
    } else {
      finalCountry = {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        symbol: '₹'
      };
    }
    
    console.log('Selected country for new user:', finalCountry);

    // Validate referral code if provided
    let referrerUser = null;
    if (referralCode && referralCode.trim() !== '') {
      console.log('Validating referral code:', referralCode);
      
      // More lenient validation - just check if it's a non-empty string
      if (typeof referralCode !== 'string' || referralCode.trim().length < 4) {
        console.log('Referral code format invalid:', referralCode);
        return NextResponse.json(
          { message: 'Invalid referral code format' },
          { status: 400 }
        );
      }

      // Check if referral code exists
      const trimmedCode = referralCode.trim();
      console.log('Looking for referral code in database:', trimmedCode);
      
      referrerUser = await User.findOne({ referralCode: trimmedCode });
      console.log('Referrer search result:', referrerUser ? `Found: ${referrerUser.email}` : 'Not found');
      
      if (!referrerUser) {
        // Let's also check what referral codes actually exist
        const allCodes = await User.find({ 
          referralCode: { $exists: true, $ne: null } 
        }).select('email referralCode');
        console.log('Available referral codes:', allCodes);
        
        return NextResponse.json(
          { 
            message: 'Invalid referral code',
            providedCode: trimmedCode,
            availableCodes: allCodes.map(u => u.referralCode)
          },
          { status: 400 }
        );
      }
      
      console.log('Referrer found:', referrerUser.email);
    }

    const hashedPassword = await hashPassword(password);

    // Create new user with country information
    const clientIP = getClientIP(request);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      referredBy: referralCode && referralCode.trim() !== '' ? referralCode.trim() : null,
      country: {
        code: finalCountry.code,
        name: finalCountry.name,
        currency: finalCountry.currency,
        symbol: finalCountry.symbol
      },
      ipAddress: clientIP
    });

    // Generate referral code for new user
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

    console.log(`New user registered: ${newUser.email} (${finalCountry.name})${referrerUser ? ` (referred by ${referrerUser.email})` : ''}`);

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        referralCode: newUser.referralCode,
        referredBy: referrerUser ? referrerUser.email : null,
        country: finalCountry
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
