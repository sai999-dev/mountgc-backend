const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const {
  createResearchPaperCheckoutSession,
  createCounsellingCheckoutSession,
  getSessionStatus,
  handleStripeWebhook,
  getTransaction,
  getUserTransactions,
  testWebhookProcessing,
} = require('../../controllers/payment/stripe.controller');

// Protected routes - require authentication
router.post('/create-checkout-session/research-paper', authenticateToken, createResearchPaperCheckoutSession);
router.post('/create-checkout-session/counselling', authenticateToken, createCounsellingCheckoutSession);
router.get('/session-status', getSessionStatus); // Public - used after redirect
router.get('/transactions', authenticateToken, getUserTransactions);
router.get('/transaction/:transactionId', authenticateToken, getTransaction);

// TEST ENDPOINT - Manually process a payment (NO AUTH for testing)
router.post('/test-webhook-processing', testWebhookProcessing);

// Note: Webhook route is registered directly in server.js BEFORE express.json() middleware
// to ensure Stripe receives the raw body for signature verification

module.exports = router;
