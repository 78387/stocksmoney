import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    // Verify admin token
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
        { message: 'Admin access required' },
        { status: 401 }
      );
    }

    console.log('Manual reward trigger initiated by admin:', decoded.adminId);

    // Call the daily reward processing API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/cron/daily-rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        message: 'Daily rewards triggered successfully',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { 
          message: 'Failed to trigger daily rewards', 
          error: result.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Manual reward trigger error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to trigger rewards', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
