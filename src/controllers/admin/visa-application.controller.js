const {
  visaApplicationConfigRepository,
  visaApplicationPurchaseRepository,
} = require('../../dal/repositories/visa-application.repository');

// ==================== CONFIG MANAGEMENT ====================

/**
 * Get all configurations
 */
const getAllConfigs = async (req, res) => {
  try {
    const configs = await visaApplicationConfigRepository.findAll();

    res.status(200).json({
      success: true,
      message: 'Configurations retrieved successfully',
      data: configs,
    });
  } catch (error) {
    console.error('Get all configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations',
      error: error.message,
    });
  }
};

/**
 * Get configuration by currency
 */
const getConfigByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;

    const configs = await visaApplicationConfigRepository.findByCurrency(currency);

    res.status(200).json({
      success: true,
      message: 'Configurations retrieved successfully',
      data: configs,
    });
  } catch (error) {
    console.error('Get config by currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configurations',
      error: error.message,
    });
  }
};

/**
 * Create or update configuration
 */
const upsertConfig = async (req, res) => {
  try {
    const {
      currency,
      dependents,
      mocks,
      actual_price,
      discounted_price,
      discount_percent,
      duration_months,
    } = req.body;

    // Validate required fields
    if (!currency || dependents === undefined || mocks === undefined || !actual_price || !discounted_price) {
      return res.status(400).json({
        success: false,
        message: 'Currency, dependents, mocks, actual_price, and discounted_price are required',
      });
    }

    // Validate currency
    const currencyCode = currency.toUpperCase().trim();
    if (currencyCode.length < 2 || currencyCode.length > 10 || !/^[A-Z]+$/.test(currencyCode)) {
      return res.status(400).json({
        success: false,
        message: 'Currency must be a valid currency code (e.g., INR, USD, EUR, GBP)',
      });
    }

    // Validate dependents (0-2)
    const dependentsNum = parseInt(dependents);
    if (dependentsNum < 0 || dependentsNum > 2) {
      return res.status(400).json({
        success: false,
        message: 'Dependents must be between 0 and 2',
      });
    }

    // Validate mocks (1-2)
    const mocksNum = parseInt(mocks);
    if (mocksNum < 1 || mocksNum > 2) {
      return res.status(400).json({
        success: false,
        message: 'Mocks must be between 1 and 2',
      });
    }

    // Validate prices
    const actualPrice = parseFloat(actual_price);
    const discountedPrice = parseFloat(discounted_price);

    if (actualPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Actual price must be greater than 0',
      });
    }

    if (discountedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discounted price must be greater than 0',
      });
    }

    if (discountedPrice >= actualPrice) {
      return res.status(400).json({
        success: false,
        message: 'Discounted price must be less than actual price',
      });
    }

    const config = await visaApplicationConfigRepository.upsertConfig({
      currency: currencyCode,
      dependents: dependentsNum,
      mocks: mocksNum,
      actual_price: actualPrice,
      discounted_price: discountedPrice,
      discount_percent: discount_percent ? parseFloat(discount_percent) : 20.0,
      duration_months: duration_months || '1-2 months',
      is_active: true,
    });

    res.status(200).json({
      success: true,
      message: 'Configuration saved successfully',
      data: config,
    });
  } catch (error) {
    console.error('Upsert config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message,
    });
  }
};

/**
 * Update configuration
 */
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await visaApplicationConfigRepository.updateConfig(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration',
      error: error.message,
    });
  }
};

/**
 * Delete configuration
 */
const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;

    await visaApplicationConfigRepository.softDelete(id);

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete configuration',
      error: error.message,
    });
  }
};

// ==================== PURCHASE MANAGEMENT ====================

/**
 * Get all purchases
 */
const getAllPurchases = async (req, res) => {
  try {
    console.log('📊 [Admin] Fetching all visa application purchases...');
    console.log('📊 [Admin] Request user:', req.user);
    console.log('📊 [Admin] Request admin:', req.admin);

    const purchases = await visaApplicationPurchaseRepository.findAllWithUsers();

    console.log(`📊 [Admin] Found ${purchases.length} visa application purchases`);

    // Fetch agreements for all users who made purchases
    const prisma = require('../../config/prisma');
    const userIds = [...new Set(purchases.map(p => p.user_id))];
    const agreements = await prisma.userAgreement.findMany({
      where: {
        user_id: { in: userIds },
        service_type: 'visa_application',
      },
      select: {
        user_id: true,
        signed_name: true,
        agreed_at: true,
        terms_title: true,
        terms_version: true,
      },
    });

    // Map agreements to purchases
    const purchasesWithAgreements = purchases.map(purchase => {
      const agreement = agreements.find(a => a.user_id === purchase.user_id);
      return {
        ...purchase,
        has_agreement: !!agreement,
        agreement_signed_at: agreement?.agreed_at || null,
        agreement_signed_name: agreement?.signed_name || null,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Purchases retrieved successfully',
      data: purchasesWithAgreements,
    });
  } catch (error) {
    console.error('❌ [Admin] Get all visa purchases error:', error);
    console.error('❌ [Admin] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchases',
      error: error.message,
    });
  }
};

/**
 * Get purchase by ID
 */
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await visaApplicationPurchaseRepository.findByIdWithUser(id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase retrieved successfully',
      data: purchase,
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase',
      error: error.message,
    });
  }
};

/**
 * Update purchase status and case management
 */
const updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, case_status } = req.body;

    const updateData = {};

    // Update status if provided
    if (status) {
      const validStatuses = ['initiated', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`,
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
          message: `Case status must be one of: ${validCaseStatuses.join(', ')}`,
        });
      }
      updateData.case_status = case_status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (status, admin_notes, or case_status) must be provided',
      });
    }

    const purchase = await visaApplicationPurchaseRepository.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase,
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase',
      error: error.message,
    });
  }
};

/**
 * Get purchase statistics
 */
const getPurchaseStats = async (req, res) => {
  try {
    const stats = await visaApplicationPurchaseRepository.getStats();

    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message,
    });
  }
};

/**
 * Get statistics by country
 */
const getStatsByCountry = async (req, res) => {
  try {
    const stats = await visaApplicationPurchaseRepository.getStatsByCountry();

    res.status(200).json({
      success: true,
      message: 'Country statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get stats by country error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve country statistics',
      error: error.message,
    });
  }
};

/**
 * Get statistics by status
 */
const getStatsByStatus = async (req, res) => {
  try {
    const stats = await visaApplicationPurchaseRepository.getStatsByStatus();

    res.status(200).json({
      success: true,
      message: 'Status statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Get stats by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve status statistics',
      error: error.message,
    });
  }
};

module.exports = {
  // Config management
  getAllConfigs,
  getConfigByCurrency,
  upsertConfig,
  updateConfig,
  deleteConfig,

  // Purchase management
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  getPurchaseStats,
  getStatsByCountry,
  getStatsByStatus,
};
