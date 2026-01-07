import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, countryCode } = await request.json();

    if (!userId || !countryCode) {
      return NextResponse.json({ error: 'Missing userId or countryCode' }, { status: 400 });
    }

    let country;
    if (countryCode === 'GB') {
      country = {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        symbol: '£'
      };
    } else {
      country = {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        symbol: '₹'
      };
    }

    const user = await User.findByIdAndUpdate(userId, { country }, { new: true });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User updated to ${country.name}`,
      user: {
        id: user._id,
        email: user.email,
        country: user.country
      }
    });

  } catch (error) {
    console.error('Error updating user country:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all users for quick reference
export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({}).select('_id name email country').limit(20);
    
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
