const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const {
  getActiveTerms,
  checkAgreement,
  signAgreement
} = require('../../controllers/student/terms.controller');

// Public route - get active terms
router.get('/terms/:service_type', getActiveTerms);

// Protected routes - require authentication
router.get('/agreement/:service_type/check', authenticateToken, checkAgreement);
router.post('/agreement/sign', authenticateToken, signAgreement);

module.exports = router;
