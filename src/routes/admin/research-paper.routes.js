const express = require('express');
const router = express.Router();
const {
  getAllConfigs,
  getConfigByCurrency,
  upsertConfig,
  updateConfig,
  deleteConfig,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  getPurchaseStats
} = require('../../controllers/admin/research-paper.controller');

// Configuration routes
router.get('/configs', getAllConfigs);
router.get('/configs/:currency', getConfigByCurrency);
router.post('/configs', upsertConfig);
router.put('/configs/:id', updateConfig);
router.delete('/configs/:id', deleteConfig);

// Purchase management routes
router.get('/purchases', getAllPurchases);
router.get('/purchases/stats', getPurchaseStats);
router.get('/purchases/:id', getPurchaseById);
router.put('/purchases/:id/status', updatePurchaseStatus);

module.exports = router;
