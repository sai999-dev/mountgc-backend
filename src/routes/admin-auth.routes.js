const express = require('express');
const router = express.Router();
const {
  requestOtp,
  verifyOtp,
  logout,
  verifyToken
} = require('../controllers/admin-auth.controller');
const { authenticateAdmin } = require('../middleware/admin-auth.middleware');

/**
 * Admin Authentication Routes (OTP-based)
 */

// Public routes
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

// Protected routes
router.post('/logout', authenticateAdmin, logout);
router.get('/verify-token', authenticateAdmin, verifyToken);

module.exports = router;
