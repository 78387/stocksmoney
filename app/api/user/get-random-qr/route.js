import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import QRCode from '@/models/QRCode';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { detectCountryFromIP, getClientIP } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    // Verify user token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's country information
    const user = await User.findById(decoded.userId).select('country');
    let userCountry = { code: 'IN' }; // Default to India
    
    if (user && user.country && user.country.code) {
      userCountry = user.country;
      console.log('User country from database:', userCountry);
    } else {
      // Fallback to IP detection
      const clientIP = getClientIP(request);
      const detectedCountry = await detectCountryFromIP(clientIP);
      userCountry = detectedCountry;
      console.log('User country from IP detection:', userCountry);
    }

    console.log('Getting QR code for country:', userCountry.code);

    // Get active QR codes for user's country
    const activeQRCodes = await QRCode.find({ 
      isActive: true,
      'country.code': userCountry.code
    });

    console.log(`Found ${activeQRCodes.length} QR codes for ${userCountry.code}`);

    if (activeQRCodes.length === 0) {
      // Fallback to any active QR code if no country-specific ones found
      const fallbackQRCodes = await QRCode.find({ isActive: true });
      
      console.log(`No QR codes found for ${userCountry.code}, found ${fallbackQRCodes.length} fallback QR codes`);
      
      if (fallbackQRCodes.length === 0) {
        return NextResponse.json(
          { error: 'No QR codes available at the moment' },
          { status: 404 }
        );
      }
      
      console.log(`Using fallback QR code for ${userCountry.code}`);
      const randomIndex = Math.floor(Math.random() * fallbackQRCodes.length);
      const selectedQR = fallbackQRCodes[randomIndex];
      
      await QRCode.findByIdAndUpdate(selectedQR._id, {
        lastUsed: new Date()
      });

      return NextResponse.json({
        success: true,
        qrCode: {
          id: selectedQR._id,
          name: selectedQR.name,
          upiId: selectedQR.upiId,
          qrImage: selectedQR.qrImage,
          country: selectedQR.country,
          paymentMethod: selectedQR.paymentMethod,
          bankDetails: selectedQR.bankDetails
        },
        userCountry: userCountry,
        fallback: true,
        message: `No ${userCountry.code} QR codes available, using fallback`
      });
    }

    // Select random QR code from country-specific ones
    const randomIndex = Math.floor(Math.random() * activeQRCodes.length);
    const selectedQR = activeQRCodes[randomIndex];

    // Update last used timestamp
    await QRCode.findByIdAndUpdate(selectedQR._id, {
      lastUsed: new Date()
    });

    // Return selected QR code (without sensitive admin info)
    return NextResponse.json({
      success: true,
      qrCode: {
        id: selectedQR._id,
        name: selectedQR.name,
        upiId: selectedQR.upiId,
        qrImage: selectedQR.qrImage,
        country: selectedQR.country,
        paymentMethod: selectedQR.paymentMethod,
        bankDetails: selectedQR.bankDetails
      },
      userCountry: userCountry,
      availableQRCodes: activeQRCodes.length
    });

  } catch (error) {
    console.error('Random QR fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to get QR code' },
      { status: 500 }
    );
  }
}
