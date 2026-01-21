const stripeService = require('../../services/stripe.service');
const prisma = require('../../config/prisma');

/**
 * Create Stripe Checkout Session for Research Paper Purchase
 */
const createResearchPaperCheckoutSession = async (req, res) => {
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
    const purchase = await prisma.researchPaperPurchase.findUnique({
      where: { purchase_id: parseInt(purchaseId) },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
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
      serviceType: 'research_paper',
      serviceId: purchase.purchase_id,
      amount: purchase.final_amount,
      currency: purchase.currency,
      description: `Research Paper - ${purchase.co_authors} Co-authors`,
      metadata: {
        purchaseName: purchase.name,
        purchaseEmail: purchase.email,
        coAuthors: purchase.co_authors.toString(),
        researchGroup: purchase.research_group.toString(),
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
 * Get session status - Called after redirect from Stripe
 */
const getSessionStatus = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Get Stripe session
    const session = await stripeService.getCheckoutSession(session_id);

    // Get transaction from database
    const transaction = await stripeService.getTransactionBySessionId(session_id);

    res.status(200).json({
      success: true,
      data: {
        paymentStatus: session.payment_status,
        transactionStatus: transaction?.payment_status,
        amount: session.amount_total / 100, // Convert from smallest unit
        currency: session.currency,
        customerEmail: session.customer_email,
        transaction: transaction,
      },
    });
  } catch (error) {
    console.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session status',
      error: error.message,
    });
  }
};

/**
 * Stripe Webhook Handler
 * Receives events from Stripe
 */
const handleStripeWebhook = async (req, res) => {
  try {
    console.log('🔔 Stripe webhook received!');
    console.log('   Headers:', Object.keys(req.headers));
    console.log('   Has signature:', !!req.headers['stripe-signature']);

    const sig = req.headers['stripe-signature'];
    const payload = req.body;

    if (!sig) {
      console.error('❌ No Stripe signature found in headers');
      return res.status(400).json({
        success: false,
        message: 'No Stripe signature found',
      });
    }

    // Verify webhook signature
    console.log('🔐 Verifying webhook signature...');
    const event = stripeService.verifyWebhookSignature(payload, sig);
    console.log('✅ Webhook signature verified successfully');

    // Process the event
    console.log('⚙️ Processing webhook event...');
    await stripeService.handleWebhookEvent(event);
    console.log('✅ Webhook event processed successfully');

    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message,
    });
  }
};

/**
 * Get transaction details
 */
const getTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        transaction_id: parseInt(transactionId),
        user_id: userId, // Ensure user owns this transaction
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message,
    });
  }
};

/**
 * Get all transactions for user
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const transactions = await prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message,
    });
  }
};

/**
 * Create Stripe Checkout Session for Counselling Session Purchase
 */
const createCounsellingCheckoutSession = async (req, res) => {
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
    const purchase = await prisma.counsellingPurchase.findUnique({
      where: { purchase_id: parseInt(purchaseId) },
      include: {
        service_type: true,
        counselor: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
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
      serviceType: 'counselling',
      serviceId: purchase.purchase_id,
      amount: purchase.final_amount,
      currency: purchase.currency,
      description: `Counselling Session - ${purchase.service_type.name}`,
      metadata: {
        purchaseName: purchase.name,
        purchaseEmail: purchase.email,
        serviceTypeName: purchase.service_type.name,
        counselorName: purchase.counselor?.name || 'Any Available',
        duration: purchase.duration,
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
    console.error('Create counselling checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message,
    });
  }
};

/**
 * TEST ENDPOINT: Manually trigger webhook processing
 * Use this to test webhook logic without Stripe CLI
 */
const testWebhookProcessing = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required in request body'
      });
    }

    console.log('🧪 TEST: Manually processing session:', sessionId);

    // Get the Stripe session
    const session = await stripeService.getCheckoutSession(sessionId);

    console.log('📋 Session details:');
    console.log('   Status:', session.payment_status);
    console.log('   Payment Intent:', session.payment_intent);
    console.log('   Amount:', session.amount_total);
    console.log('   Metadata:', session.metadata);

    // Process it
    await stripeService.handleSuccessfulPayment(session);

    res.status(200).json({
      success: true,
      message: 'Webhook processing completed',
      session: {
        id: session.id,
        payment_status: session.payment_status,
        payment_intent: session.payment_intent,
        metadata: session.metadata
      }
    });
  } catch (error) {
    console.error('❌ Test webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = {
  createResearchPaperCheckoutSession,
  createCounsellingCheckoutSession,
  getSessionStatus,
  handleStripeWebhook,
  getTransaction,
  getUserTransactions,
  testWebhookProcessing,
};
