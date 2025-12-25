const prisma = require('../../config/prisma');
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP code
 * @returns {string} - 6-digit OTP code
 */
const generateOtpCode = () => {
  // Generate random 6-digit number between 100000 and 999999
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Create and store OTP for admin login
 * @param {string} email - Admin email
 * @param {string} ipAddress - Request IP address
 * @param {string} userAgent - Request user agent
 * @param {number} expiryMinutes - OTP expiry time in minutes (default 10)
 * @returns {Promise<{otpCode: string, expiresAt: Date}>}
 */
const createOtp = async (email, ipAddress = null, userAgent = null, expiryMinutes = 10) => {
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Invalidate any existing unused OTPs for this email
  await prisma.adminOtp.updateMany({
    where: {
      email,
      is_used: false,
      expires_at: { gt: new Date() }
    },
    data: {
      is_used: true // Mark as used to prevent reuse
    }
  });

  // Create new OTP
  await prisma.adminOtp.create({
    data: {
      email,
      otp_code: otpCode,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_used: false,
      attempts: 0
    }
  });

  console.log(`✅ OTP created for ${email}: ${otpCode} (expires at ${expiresAt.toISOString()})`);

  return { otpCode, expiresAt };
};

/**
 * Validate OTP for admin login
 * @param {string} email - Admin email
 * @param {string} otpCode - OTP code to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
const validateOtp = async (email, otpCode) => {
  // Find the latest unused OTP for this email
  const otpRecord = await prisma.adminOtp.findFirst({
    where: {
      email,
      otp_code: otpCode,
      is_used: false
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  if (!otpRecord) {
    console.log(`❌ Invalid OTP for ${email}: OTP not found or already used`);
    return { valid: false, error: 'Invalid OTP code' };
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expires_at) {
    console.log(`❌ Expired OTP for ${email}`);
    await prisma.adminOtp.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    });
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check attempts (max 3)
  if (otpRecord.attempts >= 3) {
    console.log(`❌ Max attempts exceeded for ${email}`);
    await prisma.adminOtp.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    });
    return { valid: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempts
  await prisma.adminOtp.update({
    where: { id: otpRecord.id },
    data: { attempts: otpRecord.attempts + 1 }
  });

  // Mark as used (successful verification)
  await prisma.adminOtp.update({
    where: { id: otpRecord.id },
    data: { is_used: true }
  });

  console.log(`✅ OTP validated successfully for ${email}`);
  return { valid: true };
};

/**
 * Check rate limiting for OTP requests
 * @param {string} email - Admin email
 * @param {number} minutes - Time window in minutes (default 15)
 * @param {number} maxRequests - Maximum requests allowed (default 3)
 * @returns {Promise<{allowed: boolean, error?: string, remainingTime?: number}>}
 */
const checkRateLimit = async (email, minutes = 15, maxRequests = 3) => {
  const timeWindow = new Date(Date.now() - minutes * 60 * 1000);

  const recentOtps = await prisma.adminOtp.count({
    where: {
      email,
      created_at: { gte: timeWindow }
    }
  });

  if (recentOtps >= maxRequests) {
    const oldestOtp = await prisma.adminOtp.findFirst({
      where: {
        email,
        created_at: { gte: timeWindow }
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    const remainingTime = Math.ceil(
      (new Date(oldestOtp.created_at).getTime() + minutes * 60 * 1000 - Date.now()) / 1000 / 60
    );

    console.log(`⚠️ Rate limit exceeded for ${email}. ${recentOtps} requests in last ${minutes} minutes`);
    return {
      allowed: false,
      error: `Too many OTP requests. Please try again in ${remainingTime} minute(s).`,
      remainingTime
    };
  }

  return { allowed: true };
};

/**
 * Clean up expired OTPs (can be run as a cron job)
 * @param {number} daysOld - Delete OTPs older than this many days (default 7)
 * @returns {Promise<number>} - Number of deleted records
 */
const cleanupExpiredOtps = async (daysOld = 7) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const result = await prisma.adminOtp.deleteMany({
    where: {
      created_at: { lt: cutoffDate }
    }
  });

  console.log(`🧹 Cleaned up ${result.count} expired OTP records older than ${daysOld} days`);
  return result.count;
};

module.exports = {
  generateOtpCode,
  createOtp,
  validateOtp,
  checkRateLimit,
  cleanupExpiredOtps
};
