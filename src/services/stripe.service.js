const Stripe = require('stripe');
const prisma = require('../config/prisma');
const {
  sendPurchaseConfirmationEmail: sendResearchPaperConfirmationEmail,
  sendAdminNotificationEmail: sendResearchPaperAdminNotification,
} = require('./student/research-paper-email.service');
const {
  sendPurchaseConfirmationEmail: sendVisaApplicationConfirmationEmail,
  sendAdminNotificationEmail: sendVisaApplicationAdminNotification,
} = require('./student/visa-application-email.service');
const {
  sendPurchaseConfirmationEmail: sendCounsellingConfirmationEmail,
  sendAdminNotificationEmail: sendCounsellingAdminNotification,
} = require('./student/counselling-email.service');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe Payment Service
 * Handles all Stripe payment operations
 */
class StripeService {
  /**
   * Create a Stripe Checkout Session for a purchase
   * @param {Object} params - Session parameters
   * @param {number} params.userId - User ID
   * @param {string} params.serviceType - Type of service (research_paper, visa_application, etc.)
   * @param {number} params.serviceId - ID of the service purchase
   * @param {number} params.amount - Amount in smallest currency unit (e.g., cents for USD, paise for INR)
   * @param {string} params.currency - Currency code (usd, inr, eur)
   * @param {string} params.description - Description of the purchase
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<Object>} Checkout session with URL
   */
  async createCheckoutSession({
    userId,
    serviceType,
    serviceId,
    amount,
    currency,
    description,
    metadata = {}
  }) {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { user_id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: description,
                description: `${serviceType} - Order #${serviceId}`,
              },
              unit_amount: Math.round(amount * 100), // Convert to smallest unit (cents/paise)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.STRIPE_CANCEL_URL}?session_id={CHECKOUT_SESSION_ID}`,
        customer_email: user.email,
        client_reference_id: `${userId}`,
        metadata: {
          userId: userId.toString(),
          serviceType,
          serviceId: serviceId.toString(),
          ...metadata
        },
      });

      // Create transaction record in database
      const transaction = await prisma.transaction.create({
        data: {
          user_id: userId,
          service_type: serviceType,
          service_id: serviceId,
          amount: amount,
          currency: currency,
          payment_gateway: 'stripe',
          payment_status: 'pending',
          stripe_session_id: session.id,
          description: description,
          metadata: metadata,
        },
      });

      console.log(`✅ Stripe Checkout Session created: ${session.id} for transaction ${transaction.transaction_id}`);

      return {
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
        transactionId: transaction.transaction_id,
      };
    } catch (error) {
      console.error('Error creating Stripe Checkout Session:', error);
      throw error;
    }
  }

  /**
   * Retrieve a Stripe Checkout Session
   * @param {string} sessionId - Stripe Session ID
   * @returns {Promise<Object>} Session details
   */
  async getCheckoutSession(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('Error retrieving Stripe session:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   * Updates transaction and purchase status
   * @param {Object} session - Stripe session object
   */
  async handleSuccessfulPayment(session) {
    try {
      const { metadata } = session;
      const userId = parseInt(metadata.userId);
      const serviceType = metadata.serviceType;
      const serviceId = parseInt(metadata.serviceId);

      console.log(`💳 Processing successful payment for session: ${session.id}`);
      console.log(`   Service Type: ${serviceType}`);
      console.log(`   Service ID: ${serviceId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Payment Intent (raw): ${JSON.stringify(session.payment_intent)}`);
      console.log(`   Payment Status: ${session.payment_status}`);
      console.log(`   Amount: ${session.amount_total / 100}`);
      console.log(`   Customer Email: ${session.customer_details?.email || session.customer_email}`);

      // Extract payment intent ID (it can be a string or an object)
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

      console.log(`   Payment Intent ID extracted: ${paymentIntentId}`);

      // Find transaction first to verify it exists
      const existingTransaction = await prisma.transaction.findUnique({
        where: {
          stripe_session_id: session.id,
        },
      });

      if (!existingTransaction) {
        console.error(`❌ ERROR: No transaction found with stripe_session_id: ${session.id}`);
        throw new Error(`Transaction not found for session ${session.id}`);
      }

      console.log(`✅ Found transaction #${existingTransaction.transaction_id}, updating...`);

      // Update transaction with payment intent ID
      const transaction = await prisma.transaction.update({
        where: {
          stripe_session_id: session.id,
        },
        data: {
          payment_status: 'completed',
          payment_method: session.payment_method_types?.[0] || 'card',
          stripe_payment_intent_id: paymentIntentId,
          paid_at: new Date(),
        },
      });

      console.log(`✅ Transaction #${transaction.transaction_id} updated:`);
      console.log(`   - payment_status: ${transaction.payment_status}`);
      console.log(`   - stripe_payment_intent_id: ${transaction.stripe_payment_intent_id}`);
      console.log(`   - payment_method: ${transaction.payment_method}`);

      // Update service-specific purchase record
      if (serviceType === 'research_paper') {
        console.log(`📝 Updating research paper purchase #${serviceId}...`);
        const purchase = await prisma.researchPaperPurchase.update({
          where: { purchase_id: serviceId },
          data: {
            payment_status: 'completed',
            payment_id: paymentIntentId,
            payment_method: session.payment_method_types?.[0] || 'card',
            status: 'in_progress', // Move to in_progress after payment
          },
        });

        console.log(`✅ Research paper purchase #${serviceId} updated:`);
        console.log(`   - payment_status: ${purchase.payment_status}`);
        console.log(`   - payment_id: ${purchase.payment_id}`);
        console.log(`   - status: ${purchase.status}`);

        // Send confirmation email to student
        console.log('📧 Sending purchase confirmation email...');
        await sendResearchPaperConfirmationEmail({
          studentEmail: purchase.email,
          studentName: purchase.name,
          purchaseId: purchase.purchase_id,
          currency: purchase.currency,
          amount: purchase.final_amount,
          coAuthors: purchase.co_authors,
          duration: purchase.duration,
        });

        // Send notification email to admin
        console.log('📧 Sending admin notification email...');
        await sendResearchPaperAdminNotification({
          studentName: purchase.name,
          studentEmail: purchase.email,
          purchaseId: purchase.purchase_id,
          currency: purchase.currency,
          amount: purchase.final_amount,
          coAuthors: purchase.co_authors,
        });
      }
      // Handle visa application payments
      else if (serviceType === 'visa_application') {
        console.log(`📝 Updating visa application purchase #${serviceId}...`);
        const purchase = await prisma.visaApplicationPurchase.update({
          where: { purchase_id: serviceId },
          data: {
            payment_status: 'completed',
            amount_paid: session.amount_total / 100, // Convert from smallest unit
            status: 'in_progress', // Move to in_progress after payment
          },
        });

        console.log(`✅ Visa application purchase #${serviceId} updated: payment_status=${purchase.payment_status}, status=${purchase.status}, amount_paid=${purchase.amount_paid}`);

        // Send confirmation email to student
        console.log('📧 Sending visa application confirmation email...');
        await sendVisaApplicationConfirmationEmail({
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
        console.log('📧 Sending visa application admin notification email...');
        await sendVisaApplicationAdminNotification({
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

        console.log(`✅ Visa application purchase #${serviceId} payment completed and emails sent`);
      }
      // Handle counselling session payments
      else if (serviceType === 'counselling') {
        console.log(`📝 Updating counselling purchase #${serviceId}...`);
        const purchase = await prisma.counsellingPurchase.update({
          where: { purchase_id: serviceId },
          data: {
            payment_status: 'completed',
            payment_id: paymentIntentId,
            payment_method: session.payment_method_types?.[0] || 'card',
            status: 'scheduled', // Move to scheduled after payment (awaiting session scheduling)
          },
          include: {
            service_type: true,
            counselor: true,
          },
        });

        console.log(`✅ Counselling purchase #${serviceId} updated:`);
        console.log(`   - payment_status: ${purchase.payment_status}`);
        console.log(`   - payment_id: ${purchase.payment_id}`);
        console.log(`   - status: ${purchase.status}`);

        // Send confirmation email to student
        console.log('📧 Sending counselling confirmation email...');
        await sendCounsellingConfirmationEmail({
          studentEmail: purchase.email,
          studentName: purchase.name,
          purchaseId: purchase.purchase_id,
          orderId: purchase.order_id,
          currency: purchase.currency,
          amount: purchase.final_amount,
          serviceTypeName: purchase.service_type.name,
          counselorName: purchase.counselor?.name,
          duration: purchase.duration,
        });

        // Send notification email to admin
        console.log('📧 Sending counselling admin notification email...');
        await sendCounsellingAdminNotification({
          studentName: purchase.name,
          studentEmail: purchase.email,
          studentPhone: purchase.phone,
          purchaseId: purchase.purchase_id,
          orderId: purchase.order_id,
          currency: purchase.currency,
          amount: purchase.final_amount,
          serviceTypeName: purchase.service_type.name,
          counselorName: purchase.counselor?.name,
          duration: purchase.duration,
          notes: purchase.notes,
        });

        console.log(`✅ Counselling purchase #${serviceId} payment completed and emails sent`);
      }

      console.log(`✅ Payment processed successfully for ${serviceType} #${serviceId}`);

      return { success: true };
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed/cancelled payment
   * @param {Object} session - Stripe session object
   */
  async handleFailedPayment(session) {
    try {
      console.log(`❌ Processing failed payment for session: ${session.id}`);

      // Update transaction
      await prisma.transaction.updateMany({
        where: {
          stripe_session_id: session.id,
        },
        data: {
          payment_status: session.payment_status === 'unpaid' ? 'cancelled' : 'failed',
          cancelled_at: session.payment_status === 'unpaid' ? new Date() : null,
          error_message: 'Payment was not completed',
        },
      });

      console.log(`❌ Payment marked as ${session.payment_status === 'unpaid' ? 'cancelled' : 'failed'}`);

      return { success: true };
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Process Stripe webhook events
   * @param {Object} event - Stripe webhook event
   */
  async handleWebhookEvent(event) {
    try {
      console.log(`📨 Received Stripe webhook: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Created: ${new Date(event.created * 1000).toISOString()}`);

      switch (event.type) {
        case 'checkout.session.completed':
          console.log(`✅ Processing checkout.session.completed event`);
          await this.handleSuccessfulPayment(event.data.object);
          break;

        case 'checkout.session.expired':
          await this.handleFailedPayment(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          // Handle payment failure
          console.log('Payment failed:', event.data.object);
          break;

        case 'charge.refunded':
          // Handle refund
          console.log('Charge refunded:', event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Verify Stripe webhook signature
   * @param {string} payload - Request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event object
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction by session ID
   * @param {string} sessionId - Stripe session ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionBySessionId(sessionId) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { stripe_session_id: sessionId },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
