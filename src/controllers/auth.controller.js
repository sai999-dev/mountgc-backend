const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/password.utils');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken 
} = require('../utils/jwt.utils');
const { generateVerificationToken, getTokenExpiry } = require('../utils/token.utils');
const { sendVerificationEmail } = require('../services/student/email.service');
const { getDeviceInfo } = require('../utils/device.utils');
const deviceSessionRepository = require('../dal/repositories/device-session.repository');

// Signup controller
const signup = async (req, res) => {
  try {
    const { username, email, password, user_role = 'student' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        user_role,
        email_verify: false,
        verification_token: verificationToken,
        token_expires_at: tokenExpiry,
        is_active: true
      }
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, username, verificationToken);

    if (!emailResult.success) {
      // If email fails, still create user but warn
      console.error('Failed to send verification email:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: 'Signup successful! Please check your email to verify your account.',
      data: {
        email: newUser.email,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Verify email controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: { verification_token: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Check if already verified
    if (user.email_verify) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. You can login now.'
      });
    }

    // Check if token expired
    if (user.token_expires_at && new Date() > user.token_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new one.'
      });
    }

    // Update user - mark as verified
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        email_verify: true,
        email_verified_at: new Date(),
        verification_token: null,
        token_expires_at: null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.email_verify) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = getTokenExpiry();

    // Update user with new token
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        verification_token: verificationToken,
        token_expires_at: tokenExpiry
      }
    });

    // Send email
    await sendVerificationEmail(email, user.username, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Login controller - Single device only, no force login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for ${email}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if email is verified
    // TEMPORARILY DISABLED FOR TESTING - Re-enable for production
    /*
    if (!user.email_verify) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    */
    console.log('⚠️ WARNING: Email verification check is DISABLED for testing');

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Get device information
    const deviceInfo = getDeviceInfo(req);

    // Check for existing active session - STRICT: No login allowed if session exists
    const existingSession = await deviceSessionRepository.findActiveByUserId(user.user_id);

    if (existingSession) {
      console.log(`⚠️ Login denied - Active session exists for user ${user.user_id}`);
      return res.status(409).json({
        success: false,
        message: 'Device limit exceeded. You are already logged in from another device. Please logout from that device first.',
        code: 'ACTIVE_SESSION_EXISTS',
        data: {
          deviceName: existingSession.device_name,
          ipAddress: existingSession.ip_address,
          loginAt: existingSession.login_at
        }
      });
    }

    // No active session exists - Allow login
    // Generate tokens
    const accessToken = generateAccessToken(user.user_id, user.email, user.user_role);
    const refreshToken = generateRefreshToken(user.user_id);

    // Create new device session
    await deviceSessionRepository.create({
      user_id: user.user_id,
      device_id: deviceInfo.deviceId,
      device_name: deviceInfo.deviceName,
      device_type: deviceInfo.deviceType,
      ip_address: deviceInfo.ipAddress,
      user_agent: deviceInfo.userAgent,
      access_token: accessToken,
      refresh_token: refreshToken,
      is_active: true
    });

    // Update user with refresh token and last login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { 
        refresh_token: refreshToken,
        last_login_at: new Date()
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    console.log(`✅ Login successful for ${email} from ${deviceInfo.deviceName} (${deviceInfo.ipAddress})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        deviceInfo: {
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Refresh token controller
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired refresh token' 
      });
    }

    // Find user and verify refresh token matches
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId }
    });

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid refresh token' 
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user.user_id, user.email, user.user_role);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Logout controller - UPDATED to invalidate device session
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const accessToken = req.headers['authorization']?.split(' ')[1];

    console.log(`🚪 Logout request for user ${userId}`);
    console.log(`🔑 Access token present: ${!!accessToken}`);

    // ALWAYS invalidate all active sessions for this user to ensure clean logout
    try {
      const invalidateResult = await deviceSessionRepository.invalidateUserSessions(userId);
      console.log(`🔒 Invalidated ${invalidateResult.count || 0} session(s) for user ${userId}`);
    } catch (sessionError) {
      console.error(`⚠️ Error invalidating sessions: ${sessionError.message}`);
      // Continue with logout even if session invalidation fails
    }

    // Also try to invalidate specific session if access token provided (for logging)
    if (accessToken) {
      try {
        const session = await deviceSessionRepository.findByAccessToken(accessToken);
        if (session) {
          console.log(`✓ Found and invalidated session ${session.session_id}`);
        } else {
          console.log(`⚠️ No active session found for provided access token (may already be invalidated)`);
        }
      } catch (findError) {
        console.log(`⚠️ Error finding session by token: ${findError.message}`);
        // Continue with logout
      }
    }

    // Remove refresh token from user
    try {
      await prisma.user.update({
        where: { user_id: userId },
        data: { refresh_token: null }
      });
    } catch (updateError) {
      console.error(`⚠️ Error clearing refresh token: ${updateError.message}`);
      // Continue with logout
    }

    console.log(`✅ Logout successful for user ${userId} - All sessions cleared`);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, return success to allow frontend to proceed
    // This prevents users from being stuck in a logged-in state
    res.status(200).json({
      success: true,
      message: 'Logout completed with warnings',
      warning: error.message
    });
  }
};

// Get active sessions for user
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessions = await deviceSessionRepository.findAllByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map(session => ({
          sessionId: session.session_id,
          deviceName: session.device_name,
          deviceType: session.device_type,
          ipAddress: session.ip_address,
          isActive: session.is_active,
          loginAt: session.login_at,
          lastActivityAt: session.last_activity_at,
          logoutAt: session.logout_at
        }))
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  refreshAccessToken,
  logout,
  getActiveSessions
};
