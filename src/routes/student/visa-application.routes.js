const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const visaApplicationController = require('../../controllers/student/visa-application.controller');

// ==================== PRICING ROUTES (PUBLIC) ====================

// GET /api/student/visa-applications/pricing - Get pricing configurations
// Optional query parameter: ?currency=USD
router.get('/pricing', visaApplicationController.getPricingConfigs);

// POST /api/student/visa-applications/calculate - Calculate price for selected options
// Body: { currency, dependents, mocks }
router.post('/calculate', visaApplicationController.calculatePrice);

// ==================== PURCHASE ROUTES (PROTECTED) ====================

// POST /api/student/visa-applications/purchase - Create visa application purchase
// Body: { name, email, phone, country, currency, dependents, mocks, notes }
router.post('/purchase', authenticateToken, visaApplicationController.createPurchase);

// POST /api/student/visa-applications/create-checkout-session - Create Stripe checkout session
// Body: { purchaseId }
router.post('/create-checkout-session', authenticateToken, visaApplicationController.createCheckoutSession);

// GET /api/student/visa-applications/my-purchases - Get student's visa applications
router.get('/my-purchases', authenticateToken, visaApplicationController.getMyPurchases);

// GET /api/student/visa-applications/order/:orderId - Get purchase by order ID
router.get('/order/:orderId', authenticateToken, visaApplicationController.getPurchaseByOrderId);

// ==================== TEST ENDPOINT ====================
// POST /api/student/visa-applications/send-test-emails/:purchaseId - Manually send emails
router.post('/send-test-emails/:purchaseId', visaApplicationController.sendTestEmails);

module.exports = router;
