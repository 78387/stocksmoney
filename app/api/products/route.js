import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import User from '@/models/User';
import Commission from '@/models/Commission';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { detectCountryFromIP, getClientIP } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    
    let userCountry = { code: 'IN', currency: 'INR', symbol: '₹' }; // Default to India
    
    // Try to get user's country from token first
    const token = getTokenFromRequest(request);
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.userId) {
          const user = await User.findById(decoded.userId).select('country');
          if (user && user.country && user.country.code) {
            userCountry = user.country;
            console.log('User country from token:', userCountry);
          }
        }
      } catch (error) {
        console.log('Token verification failed, using IP detection');
      }
    }
    
    // If no user token, detect from IP
    if (!token || !userCountry || userCountry.code === 'IN') {
      const clientIP = getClientIP(request);
      const detectedCountry = await detectCountryFromIP(clientIP);
      if (detectedCountry && detectedCountry.code !== 'IN') {
        userCountry = detectedCountry;
        console.log('User country from IP:', userCountry);
      }
    }
    
    console.log('Final user country for products:', userCountry);
    
    // Get platform commission
    const platformCommission = await Commission.findOne({ type: 'platform', isActive: true });
    const defaultCommissionRate = platformCommission?.rate || 0;
    
    // Get products available for user's country
    const products = await Product.find({ 
      status: 'active',
      $or: [
        { targetCountry: 'BOTH' },
        { targetCountry: userCountry.code },
        { availableCountries: userCountry.code }
      ]
    }).sort({ createdAt: -1 });

    console.log(`Found ${products.length} products for country ${userCountry.code}`);

    // Transform products to include country-specific pricing and commission
    const transformedProducts = products.map(product => {
      const productObj = product.toObject();
      
      // Get pricing for user's country
      let pricing = null;
      if (product.pricing && product.pricing[userCountry.currency]) {
        pricing = product.pricing[userCountry.currency];
      } else if (product.pricing && product.pricing.INR && userCountry.code === 'IN') {
        pricing = product.pricing.INR;
      } else if (product.pricing && product.pricing.GBP && userCountry.code === 'GB') {
        pricing = product.pricing.GBP;
      } else if (product.price) {
        // Fallback to legacy price
        pricing = {
          price: product.price,
          currency: userCountry.currency,
          symbol: userCountry.symbol
        };
      }
      
      // Calculate commission - use product-specific rate or platform default
      const commissionRate = product.commissionRate || defaultCommissionRate;
      const productPrice = pricing?.price || 0;
      const dailyCommission = product.dailyCommission || (productPrice * commissionRate) / 100;
      
      return {
        ...productObj,
        currentPricing: pricing,
        userCountry: userCountry,
        commissionRate: commissionRate,
        dailyCommission: dailyCommission
      };
    });

    return NextResponse.json({
      products: transformedProducts,
      userCountry: userCountry,
      totalProducts: transformedProducts.length
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create some sample products if none exist
export async function POST() {
  try {
    await connectDB();
    
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts === 0) {
      const sampleProducts = [
        {
          name: 'Premium Digital Course',
          description: 'Complete digital marketing course with lifetime access',
          pricing: {
            INR: { price: 2999, currency: 'INR', symbol: '₹' },
            GBP: { price: 35, currency: 'GBP', symbol: '£' }
          },
          price: 2999, // Legacy field
          category: 'Education',
          deadlineDays: 30,
          targetCountry: 'BOTH',
          availableCountries: ['IN', 'GB']
        },
        {
          name: 'E-book Collection',
          description: 'Collection of 50+ premium e-books on business and technology',
          pricing: {
            INR: { price: 1499, currency: 'INR', symbol: '₹' },
            GBP: { price: 18, currency: 'GBP', symbol: '£' }
          },
          price: 1499,
          category: 'Books',
          deadlineDays: 15,
          targetCountry: 'BOTH',
          availableCountries: ['IN', 'GB']
        },
        {
          name: 'Software License',
          description: 'Premium software license with 1-year support',
          pricing: {
            INR: { price: 4999, currency: 'INR', symbol: '₹' },
            GBP: { price: 59, currency: 'GBP', symbol: '£' }
          },
          price: 4999,
          category: 'Software',
          deadlineDays: 45,
          targetCountry: 'BOTH',
          availableCountries: ['IN', 'GB']
        },
        {
          name: 'India Exclusive Course',
          description: 'Special course designed for Indian market',
          pricing: {
            INR: { price: 1999, currency: 'INR', symbol: '₹' }
          },
          price: 1999,
          category: 'Education',
          deadlineDays: 30,
          targetCountry: 'IN',
          availableCountries: ['IN']
        },
        {
          name: 'UK Business Guide',
          description: 'Comprehensive guide for UK business regulations',
          pricing: {
            GBP: { price: 25, currency: 'GBP', symbol: '£' }
          },
          category: 'Business',
          deadlineDays: 30,
          targetCountry: 'GB',
          availableCountries: ['GB']
        }
      ];

      await Product.insertMany(sampleProducts);
      
      return NextResponse.json({
        message: 'Sample products created successfully',
        count: sampleProducts.length
      });
    }

    return NextResponse.json({
      message: 'Products already exist',
      count: existingProducts
    });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
