import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({
        status: 'No token found',
        headers: Object.fromEntries(request.headers.entries())
      });
    }

    const decoded = verifyToken(token);
    
    return NextResponse.json({
      status: 'Token found',
      token: token.substring(0, 20) + '...',
      decoded: decoded ? 'Valid' : 'Invalid',
      decodedData: decoded
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Error',
      error: error.message
    });
  }
}
