import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { generateReferralCode, generateReferralLink } from "@/lib/referral";

/**
 * Get base URL safely
 */
function getBaseUrl(request) {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "stocksmoney.info";

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    `${proto}://${host}`
  );
}

/**
 * Generate unique referral code
 */
async function createUniqueReferralCode(user) {
  let referralCode;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    referralCode = generateReferralCode(user.name, user._id.toString());

    if (attempts > 0) {
      referralCode += Math.floor(Math.random() * 100);
    }

    const exists = await User.findOne({ referralCode });
    if (!exists) return referralCode;

    attempts++;
  } while (attempts < maxAttempts);

  throw new Error("Failed to generate unique referral code");
}

/**
 * Authenticate user
 */
async function authenticateUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: NextResponse.json({ message: "No token provided" }, { status: 401 }) };
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return { error: NextResponse.json({ message: "Invalid token" }, { status: 401 }) };
  }

  if (!decoded?.userId) {
    return { error: NextResponse.json({ message: "Invalid token" }, { status: 401 }) };
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return { error: NextResponse.json({ message: "User not found" }, { status: 404 }) };
  }

  return { user };
}

/* =========================
   POST – Generate referral
   ========================= */
export async function POST(request) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const baseUrl = getBaseUrl(request);

    if (!user.referralCode) {
      user.referralCode = await createUniqueReferralCode(user);
      await user.save();
    }

    return NextResponse.json({
      message: "Referral code generated successfully",
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode, baseUrl),
    });
  } catch (error) {
    console.error("Generate referral error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================
   GET – Fetch referral
   ========================= */
export async function GET(request) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error) return error;

    const baseUrl = getBaseUrl(request);

    if (!user.referralCode) {
      user.referralCode = await createUniqueReferralCode(user);
      await user.save();
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: generateReferralLink(user.referralCode, baseUrl),
    });
  } catch (error) {
    console.error("Get referral error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
