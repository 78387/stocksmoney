import { NextResponse } from 'next/server';
import { detectCountryFromIP, getClientIP } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const clientIP = getClientIP(request);
    console.log('Detecting location for IP:', clientIP);
    
    const country = await detectCountryFromIP(clientIP);
    
    return NextResponse.json({
      success: true,
      country,
      ip: clientIP,
      detectedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Location detection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to detect location',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { countryCode } = await request.json();
    
    if (!countryCode || !['IN', 'GB'].includes(countryCode)) {
      return NextResponse.json(
        { success: false, message: 'Invalid country code' },
        { status: 400 }
      );
    }
    
    const SUPPORTED_COUNTRIES = {
      IN: {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        symbol: '₹',
        flag: '🇮🇳'
      },
      GB: {
        code: 'GB', 
        name: 'United Kingdom',
        currency: 'GBP',
        symbol: '£',
        flag: '🇬🇧'
      }
    };
    
    const country = SUPPORTED_COUNTRIES[countryCode];
    
    return NextResponse.json({
      success: true,
      country,
      message: `Country set to ${country.name}`
    });
  } catch (error) {
    console.error('Country setting error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to set country',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
