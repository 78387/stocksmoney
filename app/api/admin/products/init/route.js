import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

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

    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      return NextResponse.json({
        message: 'Products already exist',
        count: existingProducts
      });
    }

    const sampleProducts = [
      {
        name: 'Premium Stock Analysis Tool',
        description: 'Advanced stock market analysis software with real-time data and AI predictions. Get daily rewards while using this powerful tool.',
        price: 2999,
        image: '/api/placeholder/300/200',
        category: 'Software',
        deadlineDays: 30,
        stock: 100,
        status: 'active'
      },
      {
        name: 'Trading Course Bundle',
        description: 'Complete trading course with video tutorials, PDFs, and live sessions. Learn while earning daily rewards.',
        price: 1999,
        image: '/api/placeholder/300/200',
        category: 'Education',
        deadlineDays: 45,
        stock: 50,
        status: 'active'
      },
      {
        name: 'Market Research Reports',
        description: 'Monthly market research reports with detailed analysis and forecasts. Premium insights with reward benefits.',
        price: 999,
        image: '/api/placeholder/300/200',
        category: 'Reports',
        deadlineDays: 15,
        stock: 200,
        status: 'active'
      },
      {
        name: 'Portfolio Management App',
        description: 'Professional portfolio management application with risk assessment. Long-term tool with extended rewards.',
        price: 4999,
        image: '/api/placeholder/300/200',
        category: 'Software',
        deadlineDays: 60,
        stock: 75,
        status: 'active'
      },
      {
        name: 'Crypto Trading Bot',
        description: 'Automated cryptocurrency trading bot with customizable strategies. High-value tool with premium rewards.',
        price: 7999,
        image: '/api/placeholder/300/200',
        category: 'Software',
        deadlineDays: 90,
        stock: 25,
        status: 'active'
      },
      {
        name: 'Financial Planning Templates',
        description: 'Excel templates for financial planning, budgeting, and investment tracking. Quick rewards for essential tools.',
        price: 599,
        image: '/api/placeholder/300/200',
        category: 'Templates',
        deadlineDays: 7,
        stock: 500,
        status: 'active'
      }
    ];

    const createdProducts = await Product.insertMany(sampleProducts);
    
    return NextResponse.json({
      message: 'Sample products created successfully',
      count: createdProducts.length,
      products: createdProducts
    }, { status: 201 });

  } catch (error) {
    console.error('Sample products creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
