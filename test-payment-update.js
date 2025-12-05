/**
 * QUICK TEST: Manually update a purchase payment status
 * Use this to verify database updates work
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentUpdate() {
  try {
    console.log('🧪 Testing payment status update...\n');

    // Get the latest purchase
    const latestVisa = await prisma.visaApplicationPurchase.findFirst({
      orderBy: { created_at: 'desc' }
    });

    const latestResearch = await prisma.researchPaperPurchase.findFirst({
      orderBy: { created_at: 'desc' }
    });

    console.log('Latest Visa Application:');
    console.log('  ID:', latestVisa?.purchase_id);
    console.log('  Status:', latestVisa?.payment_status);
    console.log('  Amount Paid:', latestVisa?.amount_paid);
    console.log('');

    console.log('Latest Research Paper:');
    console.log('  ID:', latestResearch?.purchase_id);
    console.log('  Status:', latestResearch?.payment_status);
    console.log('  Payment ID:', latestResearch?.payment_id);
    console.log('');

    // Get latest transaction
    const latestTransaction = await prisma.transaction.findFirst({
      orderBy: { created_at: 'desc' }
    });

    console.log('Latest Transaction:');
    console.log('  ID:', latestTransaction?.transaction_id);
    console.log('  Service Type:', latestTransaction?.service_type);
    console.log('  Service ID:', latestTransaction?.service_id);
    console.log('  Payment Status:', latestTransaction?.payment_status);
    console.log('  Stripe Session ID:', latestTransaction?.stripe_session_id);
    console.log('  Stripe Payment Intent:', latestTransaction?.stripe_payment_intent_id);
    console.log('');

    if (latestTransaction && latestTransaction.payment_status === 'pending') {
      console.log('⚠️  Payment is PENDING');
      console.log('');
      console.log('To manually test webhook, copy the Stripe Session ID above and run:');
      console.log('');
      console.log('curl -X POST http://localhost:3000/api/payment/stripe/test-webhook-processing \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -d '{"sessionId": "${latestTransaction.stripe_session_id}"}'`);
      console.log('');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testPaymentUpdate();
