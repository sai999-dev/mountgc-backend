const { 
  researchPaperConfigRepository,
  researchPaperPurchaseRepository 
} = require('../../dal/repositories/research-paper.repository');

// Get all available pricing configurations
const getPricingConfigs = async (req, res) => {
  try {
    const configs = await researchPaperConfigRepository.findAll();

    // Group by currency for easier frontend consumption
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.currency]) {
        acc[config.currency] = [];
      }
      acc[config.currency].push(config);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: 'Pricing configurations retrieved successfully',
      data: groupedConfigs
    });
  } catch (error) {
    console.error('Get pricing configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing configurations',
      error: error.message
    });
  }
};

// Get pricing for specific currency and co-authors
const getSpecificPricing = async (req, res) => {
  try {
    const { currency, coAuthors } = req.query;

    if (!currency || coAuthors === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Currency and coAuthors are required'
      });
    }

    const config = await researchPaperConfigRepository.findByCurrencyAndCoAuthors(
      currency, 
      coAuthors
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Pricing configuration not found for the specified options'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing retrieved successfully',
      data: config
    });
  } catch (error) {
    console.error('Get specific pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing',
      error: error.message
    });
  }
};

// Create a new purchase
const createPurchase = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const {
      name,
      email,
      phone,
      currency,
      co_authors,
      actual_amount,
      discount_amount,
      final_amount,
      duration,
      research_group,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !currency || co_authors === undefined || !final_amount) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, currency, co_authors, and final_amount are required'
      });
    }

    // Verify pricing with configuration
    const config = await researchPaperConfigRepository.findByCurrencyAndCoAuthors(
      currency,
      co_authors
    );

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing configuration'
      });
    }

    // Create purchase record
    const purchase = await researchPaperPurchaseRepository.createPurchase({
      user_id: userId,
      name,
      email,
      phone,
      currency,
      co_authors,
      actual_amount: actual_amount || config.actual_price,
      discount_amount: discount_amount || (config.actual_price - config.discounted_price),
      final_amount,
      duration: duration || config.duration_weeks,
      research_group: research_group || false,
      notes,
      payment_status: 'pending',
      status: 'initiated'
    });

    res.status(201).json({
      success: true,
      message: 'Purchase initiated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase',
      error: error.message
    });
  }
};

// Get user's purchases
const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.userId;

    const purchases = await researchPaperPurchaseRepository.findByUserId(userId);

    res.status(200).json({
      success: true,
      message: 'Purchases retrieved successfully',
      data: purchases
    });
  } catch (error) {
    console.error('Get my purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchases',
      error: error.message
    });
  }
};

// Update payment status (webhook/callback handler)
const updatePaymentStatus = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { payment_status, payment_id, payment_method } = req.body;

    if (!payment_status) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    const purchase = await researchPaperPurchaseRepository.updatePaymentStatus(
      purchaseId,
      { payment_status, payment_id, payment_method }
    );

    // If payment completed, update status to in_progress
    if (payment_status === 'completed') {
      await researchPaperPurchaseRepository.updateStatus(purchaseId, 'in_progress');
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};

module.exports = {
  getPricingConfigs,
  getSpecificPricing,
  createPurchase,
  getMyPurchases,
  updatePaymentStatus
};
