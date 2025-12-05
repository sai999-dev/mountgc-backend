const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const {
  getPricingConfigs,
  getSpecificPricing,
  createPurchase,
  getMyPurchases,
  updatePaymentStatus
} = require('../../controllers/student/research-paper.controller');

// Public routes
router.get('/pricing', getPricingConfigs);
router.get('/pricing/check', getSpecificPricing);

// Protected routes (require authentication)
router.post('/purchase', authenticateToken, createPurchase);
router.get('/my-purchases', authenticateToken, getMyPurchases);
router.put('/purchase/:purchaseId/payment', updatePaymentStatus); // Webhook - no auth needed

module.exports = router;
