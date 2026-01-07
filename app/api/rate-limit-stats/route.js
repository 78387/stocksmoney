import { NextResponse } from 'next/server';
import { getRateLimitStats, cleanupExpiredEntries } from '@/lib/rateLimiter';

export async function GET(request) {
  try {
    const stats = getRateLimitStats();
    
    return NextResponse.json({
      message: 'Rate limiter statistics',
      ...stats,
      currentTime: new Date().toLocaleString()
    });

  } catch (error) {
    console.error('Rate limit stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'cleanup') {
      cleanupExpiredEntries();
      const stats = getRateLimitStats();
      
      return NextResponse.json({
        message: 'Cleanup completed',
        ...stats
      });
    }
    
    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Rate limit cleanup error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
