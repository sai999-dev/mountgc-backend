const { 
  researchPaperConfigRepository,
  researchPaperPurchaseRepository 
} = require('../../dal/repositories/research-paper.repository');

// Get all configurations
const getAllConfigs = async (req, res) => {
  try {
    const configs = await researchPaperConfigRepository.findAll();

    res.status(200).json({
      success: true,
      message: 'Configurations retrieved successfully',
      data: configs
    });
  } catch (error) {
    console.error('Get all configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations',
      error: error.message
    });
  }
};

// Get configuration by currency
const getConfigByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;

    const configs = await researchPaperConfigRepository.findByCurrency(currency);

    res.status(200).json({
      success: true,
      message: 'Configurations retrieved successfully',
      data: configs
    });
  } catch (error) {
    console.error('Get config by currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations',
      error: error.message
    });
  }
};

// Create or update configuration
const upsertConfig = async (req, res) => {
  try {
    const { 
      currency, 
      co_authors, 
      actual_price, 
      discounted_price, 
      discount_percent,
      duration_weeks
    } = req.body;

    // Validate required fields
    if (!currency || co_authors === undefined || !actual_price || !discounted_price) {
      return res.status(400).json({
        success: false,
        message: 'Currency, co_authors, actual_price, and discounted_price are required'
      });
    }

    // Validate currency (allow any valid currency code, 2-10 characters, uppercase)
    const currencyCode = currency.toUpperCase().trim();
    if (currencyCode.length < 2 || currencyCode.length > 10 || !/^[A-Z]+$/.test(currencyCode)) {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a valid currency code (2-10 uppercase letters, e.g., INR, USD, EUR, GBP)'
      });
    }

    // Validate co_authors (allow 0-100)
    const coAuthorsNum = parseInt(co_authors);
    if (coAuthorsNum < 0 || coAuthorsNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Co-authors must be between 0 and 100'
      });
    }

    // Validate prices
    const actualPrice = parseFloat(actual_price);
    const discountedPrice = parseFloat(discounted_price);

    if (actualPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Actual price must be greater than 0'
      });
    }

    if (discountedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discounted price must be greater than 0'
      });
    }

    if (discountedPrice >= actualPrice) {
      return res.status(400).json({
        success: false,
        message: 'Discounted price must be less than actual price'
      });
    }

    const config = await researchPaperConfigRepository.upsertConfig({
      currency: currencyCode, // Use validated uppercase currency code
      co_authors: coAuthorsNum,
      actual_price: actualPrice,
      discounted_price: discountedPrice,
      discount_percent: discount_percent ? parseFloat(discount_percent) : 20.0,
      duration_weeks: duration_weeks || '3-4 weeks',
      is_active: true
    });

    res.status(200).json({
      success: true,
      message: 'Configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('Upsert config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message
    });
  }
};

// Update configuration
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await researchPaperConfigRepository.updateConfig(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error.message
    });
  }
};

// Delete configuration
const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;

    await researchPaperConfigRepository.softDelete(id);

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error.message
    });
  }
};

// Get all purchases
const getAllPurchases = async (req, res) => {
  try {
    console.log('📊 [Admin] Fetching all research paper purchases...');
    console.log('📊 [Admin] Request user:', req.user);
    console.log('📊 [Admin] Request admin:', req.admin);

    const purchases = await researchPaperPurchaseRepository.findAllWithUsers();

    console.log(`📊 [Admin] Found ${purchases.length} research paper purchases`);

    res.status(200).json({
      success: true,
      message: 'Purchases retrieved successfully',
      data: purchases
    });
  } catch (error) {
    console.error('❌ [Admin] Get all purchases error:', error);
    console.error('❌ [Admin] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchases',
      error: error.message
    });
  }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await researchPaperPurchaseRepository.findByIdWithUser(id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase retrieved successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase',
      error: error.message
    });
  }
};

// Update purchase status and case management
const updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, case_status } = req.body;

    const prisma = require('../../config/prisma');

    const updateData = {};

    // Update status if provided
    if (status) {
      const validStatuses = ['initiated', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      updateData.status = status;
    }

    // Update admin notes if provided
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    // Update case status if provided
    if (case_status) {
      const validCaseStatuses = ['open', 'closed'];
      if (!validCaseStatuses.includes(case_status)) {
        return res.status(400).json({
          success: false,
          message: `Case status must be one of: ${validCaseStatuses.join(', ')}`
        });
      }
      updateData.case_status = case_status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (status, admin_notes, or case_status) must be provided'
      });
    }

    const purchase = await prisma.researchPaperPurchase.update({
      where: { purchase_id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase',
      error: error.message
    });
  }
};

// Get purchase statistics
const getPurchaseStats = async (req, res) => {
  try {
    const stats = await researchPaperPurchaseRepository.getStats();

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllConfigs,
  getConfigByCurrency,
  upsertConfig,
  updateConfig,
  deleteConfig,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  getPurchaseStats
};
