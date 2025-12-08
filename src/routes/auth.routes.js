const express = require('express');
const router = express.Router();

const { 
  signup, 
  verifyEmail,
  resendVerificationEmail,
  login, 
  refreshAccessToken, 
  logout,
  getActiveSessions
} = require('../controllers/auth.controller');
const {
  signupValidator,
  loginValidator,
  resendVerificationValidator,
  validate
} = require('../validators/auth.validator');
const { authenticateToken, authenticateTokenForLogout } = require('../middleware/auth.middleware');

// Test endpoint for email service
router.get('/test-email', async (req, res) => {
  try {
    const { sendVerificationEmail } = require('../services/student/email.service');
    const result = await sendVerificationEmail(
      'test@example.com',
      'TestUser',
      'test-token-123'
    );
    res.json({
      success: true,
      message: 'Email test completed',
      result,
      resendConfigured: !!process.env.RESEND_API_KEY
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      resendConfigured: !!process.env.RESEND_API_KEY
    });
  }
});

// Public routes
router.post('/signup', signupValidator, validate, signup);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationValidator, validate, resendVerificationEmail);
router.post('/login', loginValidator, validate, login);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.post('/logout', authenticateTokenForLogout, logout); // Use lenient auth for logout
router.get('/sessions', authenticateToken, getActiveSessions);

module.exports = router;
