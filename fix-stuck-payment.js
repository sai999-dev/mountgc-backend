/**
 * Fix Stuck Payment
 * Manually processes a payment that succeeded in Stripe but webhook didn't update DB
 *
 * Usage: node fix-stuck-payment.js <session_id>
 * Example: node fix-stuck-payment.js cs_test_abc123
 */

require('dotenv').config();
const stripeService = require('./src/services/stripe.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStuckPayment(sessionId) {
  try {
    console.log('🔧 FIXING STUCK PAYMENT\n');
    console.log('='.repeat(60));
    console.log(`Session ID: ${sessionId}\n`);

    // 1. Check if transaction exists
    console.log('1️⃣ Checking transaction in database...');
    const transaction = await prisma.transaction.findUnique({
      where: { stripe_session_id: sessionId }
    });

    if (!transaction) {
      console.error('❌ No transaction found with this session ID!');
      console.error('   This payment was never initiated from your system.');
      process.exit(1);
    }

    console.log('✅ Transaction found:');
    console.log(`   ID: ${transaction.transaction_id}`);
    console.log(`   Service: ${transaction.service_type} #${transaction.service_id}`);
    console.log(`   Current Status: ${transaction.payment_status}`);
    console.log(`   Payment Intent: ${transaction.stripe_payment_intent_id || 'NULL'}`);

    if (transaction.payment_status === 'completed' && transaction.stripe_payment_intent_id) {
      console.log('\n✅ This transaction is already completed!');
      console.log('   No fix needed.');
      process.exit(0);
    }

    // 2. Get session from Stripe
    console.log('\n2️⃣ Fetching session from Stripe...');
    const session = await stripeService.getCheckoutSession(sessionId);

    console.log('✅ Session retrieved:');
    console.log(`   Status: ${session.status}`);
    console.log(`   Payment Status: ${session.payment_status}`);
    console.log(`   Payment Intent: ${session.payment_intent}`);
    console.log(`   Amount: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);

    if (session.payment_status !== 'paid') {
      console.log('\n❌ Payment was not successful in Stripe!');
      console.log(`   Payment status: ${session.payment_status}`);
      console.log('   Nothing to fix.');
      process.exit(1);
    }

    // 3. Process the payment
    console.log('\n3️⃣ Processing payment...');
    await stripeService.handleSuccessfulPayment(session);

    console.log('\n✅ PAYMENT FIXED SUCCESSFULLY!\n');

    // 4. Verify fix
    console.log('4️⃣ Verifying fix...');
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { stripe_session_id: sessionId }
    });

    console.log('Updated transaction:');
    console.log(`   Payment Status: ${updatedTransaction.payment_status} ✅`);
    console.log(`   Payment Intent: ${updatedTransaction.stripe_payment_intent_id} ✅`);
    console.log(`   Paid At: ${updatedTransaction.paid_at} ✅`);

    // Check purchase record
    if (transaction.service_type === 'research_paper') {
      const purchase = await prisma.researchPaperPurchase.findUnique({
        where: { purchase_id: transaction.service_id }
      });
      console.log('\nResearch Paper Purchase:');
      console.log(`   Payment Status: ${purchase.payment_status} ✅`);
      console.log(`   Payment ID: ${purchase.payment_id} ✅`);
      console.log(`   Status: ${purchase.status} ✅`);
    } else if (transaction.service_type === 'visa_application') {
      const purchase = await prisma.visaApplicationPurchase.findUnique({
        where: { purchase_id: transaction.service_id }
      });
      console.log('\nVisa Application Purchase:');
      console.log(`   Payment Status: ${purchase.payment_status} ✅`);
      console.log(`   Amount Paid: ${purchase.amount_paid} ✅`);
      console.log(`   Status: ${purchase.status} ✅`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All done! Payment has been fixed.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get session ID from command line
const sessionId = process.argv[2];

if (!sessionId) {
  console.log('Usage: node fix-stuck-payment.js <session_id>');
  console.log('Example: node fix-stuck-payment.js cs_test_abc123xyz\n');
  console.log('To find session IDs, run: node diagnose-payment-issue.js');
  process.exit(1);
}

fixStuckPayment(sessionId);
