const {
  visaApplicationConfigRepository,
  visaApplicationPurchaseRepository,
} = require('../../dal/repositories/visa-application.repository');
const stripeService = require('../../services/stripe.service');
const {
  sendPurchaseConfirmationEmail,
  sendAdminNotificationEmail,
} = require('../../services/student/visa-application-email.service');

/**
 * Get pricing configurations
 * Get all active configurations or filter by currency
 */
const getPricingConfigs = async (req, res) => {
  try {
    const { currency } = req.query;

    let configs;
    if (currency) {
      configs = await visaApplicationConfigRepository.findByCurrency(currency);
    } else {
      configs = await visaApplicationConfigRepository.findAll();
    }

    res.status(200).json({
      success: true,
      message: 'Pricing configurations retrieved successfully',
      data: configs,
    });
  } catch (error) {
    console.error('Get pricing configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing configurations',
      error: error.message,
    });
  }
};

/**
 * Calculate price for visa application
 */
const calculatePrice = async (req, res) => {
  try {
    const { currency, dependents, mocks } = req.body;

    // Validate required fields
    if (!currency || dependents === undefined || mocks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Currency, dependents, and mocks are required',
      });
    }

    // Find configuration
    const config = await visaApplicationConfigRepository.findByParams(
      currency,
      dependents,
      mocks
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Pricing configuration not found for the selected parameters',
      });
    }

    // Calculate amounts
    const actualAmount = config.actual_price;
    const discountedAmount = config.discounted_price;
    const discountAmount = actualAmount - discountedAmount;
    const discountPercent = config.discount_percent;

    res.status(200).json({
      success: true,
      message: 'Price calculated successfully',
      data: {
        currency: config.currency,
        dependents: config.dependents,
        mocks: config.mocks,
        actual_amount: actualAmount,
        discounted_amount: discountedAmount,
        discount_amount: discountAmount,
        discount_percent: discountPercent,
        duration: config.duration_months,
        visa_guarantee: true,
      },
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: error.message,
    });
  }
};

/**
 * Create visa application purchase
 * (Without payment - manual processing)
 */
const createPurchase = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const {
      name,
      email,
      phone,
      country,
      currency,
      dependents,
      mocks,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !country || !currency || dependents === undefined || mocks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, country, currency, dependents, and mocks are required',
      });
    }

    // Find pricing configuration
    const config = await visaApplicationConfigRepository.findByParams(
      currency,
      dependents,
      mocks
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Pricing configuration not found for the selected parameters',
      });
    }

    // Calculate amounts
    const actualAmount = config.actual_price;
    const discountedAmount = config.discounted_price;
    const discountAmount = actualAmount - discountedAmount;

    // Create purchase (without payment for now)
    const purchase = await visaApplicationPurchaseRepository.create({
      user_id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      country: country.trim(),
      currency: config.currency,
      dependents: config.dependents,
      mocks: config.mocks,
      actual_amount: actualAmount,
      discount_amount: discountAmount,
      final_amount: discountedAmount,
      amount_paid: 0, // Will be updated when Stripe is integrated
      duration: config.duration_months,
      payment_status: 'pending',
      visa_guarantee: true,
      notes: notes || null,
      status: 'initiated',
      case_status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Visa application created successfully. Our team will contact you shortly.',
      data: purchase,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visa application',
      error: error.message,
    });
  }
};

/**
 * Create Stripe Checkout Session for Visa Application Purchase
 */
const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { purchaseId } = req.body;

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: 'Purchase ID is required',
      });
    }

    // Get purchase details
    const purchase = await visaApplicationPurchaseRepository.findByIdWithUser(
      parseInt(purchaseId)
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Visa application purchase not found',
      });
    }

    // Verify purchase belongs to user
    if (purchase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this purchase',
      });
    }

    // Check if already paid
    if (purchase.payment_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This purchase has already been paid',
      });
    }

    // Create Stripe Checkout Session
    const session = await stripeService.createCheckoutSession({
      userId,
      serviceType: 'visa_application',
      serviceId: purchase.purchase_id,
      amount: purchase.final_amount,
      currency: purchase.currency,
      description: `Visa Application - ${purchase.country} (${purchase.dependents} dependents, ${purchase.mocks} mocks)`,
      metadata: {
        purchaseName: purchase.name,
        purchaseEmail: purchase.email,
        country: purchase.country,
        dependents: purchase.dependents.toString(),
        mocks: purchase.mocks.toString(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Checkout session created successfully',
      data: {
        sessionId: session.sessionId,
        sessionUrl: session.sessionUrl,
        transactionId: session.transactionId,
      },
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};

/**
 * Get student's visa application purchases
 */
const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware

    const purchases = await visaApplicationPurchaseRepository.findByUserId(userId);

    res.status(200).json({
      success: true,
      message: 'Your visa applications retrieved successfully',
      data: purchases,
    });
  } catch (error) {
    console.error('Get my purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your visa applications',
      error: error.message,
    });
  }
};

/**
 * Get purchase by order ID
 */
const getPurchaseByOrderId = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { orderId } = req.params;

    const purchase = await visaApplicationPurchaseRepository.findByOrderId(orderId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Visa application not found',
      });
    }

    // Check if purchase belongs to the user
    if (purchase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This visa application does not belong to you.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visa application retrieved successfully',
      data: purchase,
    });
  } catch (error) {
    console.error('Get purchase by order ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visa application',
      error: error.message,
    });
  }
};

/**
 * TEST ENDPOINT: Manually send confirmation emails
 * Use this to test email sending for a purchase
 */
const sendTestEmails = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    // Get purchase details
    const purchase = await visaApplicationPurchaseRepository.findByIdWithUser(
      parseInt(purchaseId)
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Visa application purchase not found',
      });
    }

    console.log('📧 Sending test emails for purchase #', purchaseId);

    // Send confirmation email to student
    const studentEmailResult = await sendPurchaseConfirmationEmail({
      studentEmail: purchase.email,
      studentName: purchase.name,
      purchaseId: purchase.purchase_id,
      orderId: purchase.order_id,
      currency: purchase.currency,
      amount: purchase.final_amount,
      country: purchase.country,
      dependents: purchase.dependents,
      mocks: purchase.mocks,
      duration: purchase.duration,
    });

    // Send notification email to admin
    const adminEmailResult = await sendAdminNotificationEmail({
      studentName: purchase.name,
      studentEmail: purchase.email,
      studentPhone: purchase.phone,
      purchaseId: purchase.purchase_id,
      orderId: purchase.order_id,
      currency: purchase.currency,
      amount: purchase.final_amount,
      country: purchase.country,
      dependents: purchase.dependents,
      mocks: purchase.mocks,
      notes: purchase.notes,
    });

    res.status(200).json({
      success: true,
      message: 'Test emails sent successfully',
      data: {
        studentEmail: studentEmailResult,
        adminEmail: adminEmailResult,
      },
    });
  } catch (error) {
    console.error('Send test emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test emails',
      error: error.message,
    });
  }
};

module.exports = {
  getPricingConfigs,
  calculatePrice,
  createPurchase,
  createCheckoutSession,
  getMyPurchases,
  getPurchaseByOrderId,
  sendTestEmails,
};
