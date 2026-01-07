import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Commission from '@/models/Commission';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const platformCommission = await Commission.findOne({ type: 'platform', isActive: true });
    
    return NextResponse.json({
      platformCommission: platformCommission?.rate || 0
    });

  } catch (error) {
    console.error('Commission fetch error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { rate } = await request.json();

    if (rate < 0 || rate > 100) {
      return NextResponse.json({ message: 'Commission rate must be between 0-100%' }, { status: 400 });
    }

    // Deactivate existing platform commission
    await Commission.updateMany({ type: 'platform' }, { isActive: false });

    // Create new platform commission
    const commission = new Commission({
      type: 'platform',
      rate,
      isActive: true
    });

    await commission.save();

    return NextResponse.json({
      message: 'Platform commission updated successfully',
      rate
    });

  } catch (error) {
    console.error('Commission update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
