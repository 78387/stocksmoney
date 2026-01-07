// Referral system utilities

/**
 * Generate a unique referral code from user's name
 * @param {string} name - User's name
 * @param {string} userId - User's ID for uniqueness
 * @returns {string} - Unique referral code
 */
export function generateReferralCode(name, userId) {
  // Create a slug from the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .substring(0, 8); // Take first 8 characters
  
  // Add last 4 characters of userId for uniqueness
  const uniqueId = userId.slice(-4);
  
  return `${slug}${uniqueId}`;
}

/**
 * Validate referral code format
 * @param {string} code - Referral code to validate
 * @returns {boolean} - Is valid format
 */
export function isValidReferralCode(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Should be alphanumeric, 4-12 characters
  return /^[a-z0-9]{4,12}$/.test(code);
}

/**
 * Get referral bonus amount (can be made configurable later)
 * @returns {number} - Bonus amount in rupees
 */
export function getReferralBonus() {
  return 50; // ₹50 default bonus
}

/**
 * Generate referral link
 * @param {string} referralCode - User's referral code
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} - Complete referral link
 */
export function generateReferralLink(referralCode, baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000') {
  return `${baseUrl}/register?ref=${referralCode}`;
}
