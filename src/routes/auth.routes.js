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
