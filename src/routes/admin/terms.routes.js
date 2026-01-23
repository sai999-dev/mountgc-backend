const express = require('express');
const router = express.Router();
const {
  getAllTerms,
  getActiveTerms,
  createTerms,
  updateTerms,
  activateTermsVersion,
  getAllAgreements,
  getAgreementStats,
  getAgreementById,
  downloadAgreementPDF
} = require('../../controllers/admin/terms.controller');

// No need to apply authentication here - already applied in admin/index.js

// Terms management
router.get('/terms', getAllTerms);
router.get('/terms/:service_type/active', getActiveTerms);
router.post('/terms', createTerms);
router.put('/terms/:terms_id', updateTerms);
router.patch('/terms/:terms_id/activate', activateTermsVersion);

// User agreements
router.get('/agreements', getAllAgreements);
router.get('/agreements/stats', getAgreementStats);
router.get('/agreements/:agreement_id', getAgreementById);
router.get('/agreements/:agreement_id/pdf', downloadAgreementPDF);

module.exports = router;
