import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get all products for admin
export async function GET(request) {
  try {
    await connectDB();
    
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
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    let query = {};
    if (country && ['IN', 'GB'].includes(country)) {
      query = {
        $or: [
          { targetCountry: country },
          { targetCountry: 'BOTH' },
          { availableCountries: country }
        ]
      };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    });

  } catch (error) {
    console.error('Admin products fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new product
export async function POST(request) {
  try {
    await connectDB();
    
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
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { 
      name, 
      description, 
      pricing,
      image,
      category,
      deadlineDays,
      dailyCommission,
      commissionRate,
      targetCountry,
      availableCountries,
      stock
    } = await request.json();

    if (!name || !description || !pricing) {
      return NextResponse.json(
        { message: 'Name, description, and pricing are required' },
        { status: 400 }
      );
    }

    // Validate pricing structure
    if (!pricing.INR && !pricing.GBP) {
      return NextResponse.json(
        { message: 'At least one currency pricing (INR or GBP) is required' },
        { status: 400 }
      );
    }

    const newProduct = new Product({
      name,
      description,
      pricing,
      price: pricing.INR?.price || 0, // Legacy field
      image: image || '/placeholder-product.jpg',
      category: category || 'Digital Product',
      deadlineDays: deadlineDays || 30,
      dailyCommission: dailyCommission || 0,
      commissionRate: commissionRate || 0,
      targetCountry: targetCountry || 'BOTH',
      availableCountries: availableCountries || ['IN', 'GB'],
      stock: stock || 999
    });

    await newProduct.save();

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(request) {
  try {
    await connectDB();
    
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
        { message: 'Invalid admin token' },
        { status: 401 }
      );
    }

    const { 
      id,
      name, 
      description, 
      pricing,
      image,
      category,
      deadlineDays,
      dailyCommission,
      commissionRate,
      targetCountry,
      availableCountries,
      stock,
      status
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (pricing) {
      updateData.pricing = pricing;
      updateData.price = pricing.INR?.price || 0; // Update legacy field
    }
    if (image) updateData.image = image;
    if (category) updateData.category = category;
    if (deadlineDays) updateData.deadlineDays = deadlineDays;
    if (dailyCommission !== undefined) updateData.dailyCommission = dailyCommission;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
    if (targetCountry) updateData.targetCountry = targetCountry;
    if (availableCountries) updateData.availableCountries = availableCountries;
    if (stock !== undefined) updateData.stock = stock;
    if (status) updateData.status = status;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
