import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Get all users with their country info
    const users = await User.find({}).select('name email country').limit(10);
    
    return NextResponse.json({
      users: users.map(user => ({
        name: user.name,
        email: user.email,
        country: user.country
      }))
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
