import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({
        error: 'No token provided',
        headers: Object.fromEntries(request.headers.entries())
      }, { status: 401 });
    }

    const decoded = verifyToken(token);
    
    return NextResponse.json({
      token: token.substring(0, 20) + '...',
      decoded: decoded ? { userId: decoded.userId, exp: decoded.exp } : null,
      isValid: !!decoded
    });

  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
