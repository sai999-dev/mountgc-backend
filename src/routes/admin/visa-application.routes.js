const express = require('express');
const router = express.Router();
const visaApplicationController = require('../../controllers/admin/visa-application.controller');

// ==================== CONFIG ROUTES ====================

// GET /api/admin/visa-applications/configs - Get all configurations
router.get('/configs', visaApplicationController.getAllConfigs);

// GET /api/admin/visa-applications/configs/:currency - Get configurations by currency
router.get('/configs/:currency', visaApplicationController.getConfigByCurrency);

// POST /api/admin/visa-applications/configs - Create or update configuration
router.post('/configs', visaApplicationController.upsertConfig);

// PUT /api/admin/visa-applications/configs/:id - Update configuration
router.put('/configs/:id', visaApplicationController.updateConfig);

// DELETE /api/admin/visa-applications/configs/:id - Delete configuration
router.delete('/configs/:id', visaApplicationController.deleteConfig);

// ==================== PURCHASE ROUTES ====================

// GET /api/admin/visa-applications/purchases - Get all purchases
router.get('/purchases', visaApplicationController.getAllPurchases);

// GET /api/admin/visa-applications/purchases/stats - Get purchase statistics
router.get('/purchases/stats', visaApplicationController.getPurchaseStats);

// GET /api/admin/visa-applications/purchases/stats/country - Get statistics by country
router.get('/purchases/stats/country', visaApplicationController.getStatsByCountry);

// GET /api/admin/visa-applications/purchases/stats/status - Get statistics by status
router.get('/purchases/stats/status', visaApplicationController.getStatsByStatus);

// GET /api/admin/visa-applications/purchases/:id - Get purchase by ID
router.get('/purchases/:id', visaApplicationController.getPurchaseById);

// PUT /api/admin/visa-applications/purchases/:id - Update purchase
router.put('/purchases/:id', visaApplicationController.updatePurchaseStatus);

module.exports = router;
