// Rate limiter for login attempts
const loginAttempts = new Map();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 3,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  cleanupInterval: 60 * 60 * 1000   // 1 hour cleanup interval
};

/**
 * Check if email is rate limited
 * @param {string} email - Email to check
 * @returns {Object} - { isLocked: boolean, remainingTime: number, attempts: number }
 */
export function checkRateLimit(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  
  if (!loginAttempts.has(key)) {
    return { isLocked: false, remainingTime: 0, attempts: 0 };
  }
  
  const attemptData = loginAttempts.get(key);
  
  // Check if lockout period has expired
  if (attemptData.lockedUntil && now >= attemptData.lockedUntil) {
    // Reset attempts after lockout expires
    loginAttempts.delete(key);
    return { isLocked: false, remainingTime: 0, attempts: 0 };
  }
  
  // Check if currently locked
  if (attemptData.lockedUntil && now < attemptData.lockedUntil) {
    const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000 / 60); // minutes
    return { 
      isLocked: true, 
      remainingTime, 
      attempts: attemptData.attempts 
    };
  }
  
  return { 
    isLocked: false, 
    remainingTime: 0, 
    attempts: attemptData.attempts || 0 
  };
}

/**
 * Record a failed login attempt
 * @param {string} email - Email that failed login
 * @returns {Object} - { isLocked: boolean, remainingTime: number, attempts: number }
 */
export function recordFailedAttempt(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  
  let attemptData = loginAttempts.get(key) || { attempts: 0, firstAttempt: now };
  
  // Reset if it's been more than lockout duration since first attempt
  if (now - attemptData.firstAttempt > RATE_LIMIT_CONFIG.lockoutDuration) {
    attemptData = { attempts: 0, firstAttempt: now };
  }
  
  attemptData.attempts += 1;
  attemptData.lastAttempt = now;
  
  // Lock account if max attempts reached
  if (attemptData.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    attemptData.lockedUntil = now + RATE_LIMIT_CONFIG.lockoutDuration;
    console.log(`🔒 Account locked for ${email} until ${new Date(attemptData.lockedUntil).toLocaleString()}`);
  }
  
  loginAttempts.set(key, attemptData);
  
  const remainingTime = attemptData.lockedUntil ? 
    Math.ceil((attemptData.lockedUntil - now) / 1000 / 60) : 0;
  
  return {
    isLocked: attemptData.lockedUntil && now < attemptData.lockedUntil,
    remainingTime,
    attempts: attemptData.attempts
  };
}

/**
 * Clear failed attempts for successful login
 * @param {string} email - Email that successfully logged in
 */
export function clearFailedAttempts(email) {
  const key = email.toLowerCase();
  loginAttempts.delete(key);
  console.log(`✅ Cleared failed attempts for ${email}`);
}

/**
 * Get remaining attempts before lockout
 * @param {string} email - Email to check
 * @returns {number} - Remaining attempts
 */
export function getRemainingAttempts(email) {
  const key = email.toLowerCase();
  const attemptData = loginAttempts.get(key);
  
  if (!attemptData) {
    return RATE_LIMIT_CONFIG.maxAttempts;
  }
  
  return Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - attemptData.attempts);
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [email, attemptData] of loginAttempts.entries()) {
    // Remove entries that are older than lockout duration and not currently locked
    if ((!attemptData.lockedUntil || now >= attemptData.lockedUntil) && 
        (now - attemptData.lastAttempt > RATE_LIMIT_CONFIG.lockoutDuration)) {
      loginAttempts.delete(email);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
  }
}

// Auto cleanup every hour
setInterval(cleanupExpiredEntries, RATE_LIMIT_CONFIG.cleanupInterval);

/**
 * Get current rate limit stats (for debugging)
 */
export function getRateLimitStats() {
  return {
    totalTrackedEmails: loginAttempts.size,
    config: RATE_LIMIT_CONFIG,
    entries: Array.from(loginAttempts.entries()).map(([email, data]) => ({
      email,
      attempts: data.attempts,
      isLocked: data.lockedUntil && Date.now() < data.lockedUntil,
      lockedUntil: data.lockedUntil ? new Date(data.lockedUntil).toLocaleString() : null
    }))
  };
}
