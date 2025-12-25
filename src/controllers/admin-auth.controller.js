const { createOtp, validateOtp, checkRateLimit } = require('../services/admin/admin-otp.service');
const { sendAdminOtpEmail } = require('../services/admin/admin-otp-email.service');
const { generateAdminAccessToken } = require('../utils/jwt.utils');

// Allowed admin emails (from environment or hardcoded)
const ALLOWED_ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
  : ['kasaramvamshi7143@gmail.com'];

/**
 * Request OTP for admin login
 * POST /api/admin-auth/request-otp
 */
const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is in allowed list
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log(`⚠️ Unauthorized admin login attempt: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'This email is not authorized for admin access'
      });
    }

    // Check rate limiting
    const rateCheck = await checkRateLimit(normalizedEmail, 15, 3);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: rateCheck.error,
        remainingTime: rateCheck.remainingTime
      });
    }

    // Get request metadata
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create OTP
    const { otpCode, expiresAt } = await createOtp(normalizedEmail, ipAddress, userAgent, 10);

    // Send OTP email
    const emailResult = await sendAdminOtpEmail(normalizedEmail, otpCode, 10);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully! Please check your email.',
      data: {
        email: normalizedEmail,
        expiresIn: 10 // minutes
      }
    });

  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Verify OTP and login
 * POST /api/admin-auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is in allowed list
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      return res.status(403).json({
        success: false,
        message: 'This email is not authorized for admin access'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. OTP must be 6 digits.'
      });
    }

    // Validate OTP
    const validation = await validateOtp(normalizedEmail, otp);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error
      });
    }

    // Generate long-lived JWT token (30 days)
    const accessToken = generateAdminAccessToken(normalizedEmail);

    // Return success with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          email: normalizedEmail,
          role: 'admin'
        }
      }
    });

    console.log(`✅ Admin logged in successfully: ${normalizedEmail}`);

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Logout admin
 * POST /api/admin-auth/logout
 */
const logout = async (req, res) => {
  try {
    // For OTP-based auth, logout is handled client-side by clearing tokens
    // We just acknowledge the logout here

    const email = req.admin?.email || 'unknown';

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

    console.log(`🚪 Admin logged out: ${email}`);

  } catch (error) {
    console.error('Logout error:', error);
    res.status(200).json({
      success: true,
      message: 'Logout completed'
    });
  }
};

/**
 * Verify admin token (for protected routes)
 * GET /api/admin-auth/verify-token
 */
const verifyToken = async (req, res) => {
  try {
    // If this endpoint is reached, it means the auth middleware passed
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.admin
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
  logout,
  verifyToken
};
