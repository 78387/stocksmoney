import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { generateReferralCode, generateReferralLink } from "@/lib/referral";

export async function POST(request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Determine base URL (prefer explicit public site env, then NEXTAUTH_URL, then request headers)
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "stocksmoney.info";
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      `${proto}://${host}`;

    // If user already has a referral code, return it
    if (user.referralCode) {
      return NextResponse.json({
        referralCode: user.referralCode,
        referralLink: generateReferralLink(user.referralCode, baseUrl),
      });
    }

    // Generate new referral code
    let referralCode;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      referralCode = generateReferralCode(user.name, user._id.toString());

      // Add random suffix if code already exists
      if (attempts > 0) {
        referralCode += Math.floor(Math.random() * 100);
      }

      const existingUser = await User.findOne({ referralCode });
      if (!existingUser) break;

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { message: "Failed to generate unique referral code" },
        { status: 500 }
      );
    }

    // Update user with referral code
    user.referralCode = referralCode;
    await user.save();

    return NextResponse.json({
      message: "Referral code generated successfully",
      referralCode,
      referralLink: generateReferralLink(referralCode, baseUrl),
    });
  } catch (error) {
    console.error("Generate referral error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // If user doesn't have referral code, generate one automatically
    if (!user.referralCode) {
      let referralCode;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        referralCode = generateReferralCode(user.name, user._id.toString());

        if (attempts > 0) {
          referralCode += Math.floor(Math.random() * 100);
        }

        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) break;

        attempts++;
      } while (attempts < maxAttempts);

      if (attempts < maxAttempts) {
        user.referralCode = referralCode;
        await user.save();
      } else {
        return NextResponse.json(
          { message: "Failed to generate unique referral code" },
          { status: 500 }
        );
      }
    }

    const getProto = request.headers.get("x-forwarded-proto") || "https";
    const getHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "stocksmoney.info";
    const getBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL ||
      `${getProto}://${getHost}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode, getBaseUrl),
    });
  } catch (error) {
    console.error("Get referral error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}