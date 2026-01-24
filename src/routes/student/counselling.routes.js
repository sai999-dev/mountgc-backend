const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth.middleware');
const {
  getPricing,
  createPurchase,
  getMyPurchases,
  getPurchaseById,
} = require('../../controllers/student/counselling.controller');

// Public routes
router.get('/pricing', getPricing);

// Protected routes (require authentication)
router.post('/purchase', authenticateToken, createPurchase);
router.get('/my-purchases', authenticateToken, getMyPurchases);
router.get('/purchase/:id', authenticateToken, getPurchaseById);

module.exports = router;
