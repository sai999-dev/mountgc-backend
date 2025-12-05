/**
 * Diagnose Payment Issue
 * This script checks your database and shows exactly what's NULL
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  try {
    console.log('🔍 PAYMENT ISSUE DIAGNOSIS\n');
    console.log('='.repeat(60));

    // Check latest transactions
    console.log('\n1️⃣ TRANSACTIONS TABLE:');
    console.log('─'.repeat(60));
    const transactions = await prisma.transaction.findMany({
      orderBy: { created_at: 'desc' },
      take: 5
    });

    if (transactions.length === 0) {
      console.log('❌ No transactions found in database!');
      console.log('   This means checkout sessions are not being created.');
      console.log('\n   Check:');
      console.log('   - Is the purchase endpoint being called?');
      console.log('   - Is the checkout session creation working?');
    } else {
      transactions.forEach((t, i) => {
        console.log(`\nTransaction #${i + 1} (ID: ${t.transaction_id}):`);
        console.log(`   Created: ${t.created_at.toISOString()}`);
        console.log(`   Service: ${t.service_type} #${t.service_id}`);
        console.log(`   Stripe Session ID: ${t.stripe_session_id || '❌ NULL'}`);
        console.log(`   Payment Intent ID: ${t.stripe_payment_intent_id || '❌ NULL'}`);
        console.log(`   Payment Status: ${t.payment_status} ${t.payment_status === 'pending' ? '⚠️' : '✅'}`);
        console.log(`   Amount: ${t.currency} ${t.amount}`);
        console.log(`   Paid At: ${t.paid_at || '❌ NULL'}`);

        // Diagnosis
        if (!t.stripe_session_id) {
          console.log('   🚨 ISSUE: No session ID! Checkout never created.');
        } else if (!t.stripe_payment_intent_id && t.payment_status === 'pending') {
          console.log('   🚨 ISSUE: Webhook not processing! Payment intent missing.');
        } else if (t.payment_status === 'completed' && t.stripe_payment_intent_id) {
          console.log('   ✅ This transaction looks good!');
        }
      });
    }

    // Check research paper purchases
    console.log('\n\n2️⃣ RESEARCH PAPER PURCHASES:');
    console.log('─'.repeat(60));
    const researchPapers = await prisma.researchPaperPurchase.findMany({
      orderBy: { created_at: 'desc' },
      take: 3
    });

    if (researchPapers.length === 0) {
      console.log('No research paper purchases found.');
    } else {
      researchPapers.forEach((p, i) => {
        console.log(`\nPurchase #${i + 1} (ID: ${p.purchase_id}):`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Payment ID: ${p.payment_id || '❌ NULL'}`);
        console.log(`   Payment Status: ${p.payment_status} ${p.payment_status === 'pending' ? '⚠️' : '✅'}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Amount: ${p.currency} ${p.final_amount}`);

        if (!p.payment_id && p.payment_status === 'pending') {
          console.log('   🚨 ISSUE: Webhook not updating payment_id!');
        }
      });
    }

    // Check visa application purchases
    console.log('\n\n3️⃣ VISA APPLICATION PURCHASES:');
    console.log('─'.repeat(60));
    const visas = await prisma.visaApplicationPurchase.findMany({
      orderBy: { created_at: 'desc' },
      take: 3
    });

    if (visas.length === 0) {
      console.log('No visa application purchases found.');
    } else {
      visas.forEach((p, i) => {
        console.log(`\nPurchase #${i + 1} (ID: ${p.purchase_id}):`);
        console.log(`   Name: ${p.name}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Amount Paid: ${p.amount_paid} ${p.amount_paid === 0 ? '❌' : '✅'}`);
        console.log(`   Payment Status: ${p.payment_status} ${p.payment_status === 'pending' ? '⚠️' : '✅'}`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Expected Amount: ${p.currency} ${p.final_amount}`);

        if (p.amount_paid === 0 && p.payment_status === 'pending') {
          console.log('   🚨 ISSUE: Webhook not updating amount_paid!');
        }
      });
    }

    // Overall diagnosis
    console.log('\n\n4️⃣ DIAGNOSIS SUMMARY:');
    console.log('='.repeat(60));

    const nullPaymentIntents = transactions.filter(t => !t.stripe_payment_intent_id && t.payment_status === 'pending').length;
    const pendingPayments = [...researchPapers, ...visas].filter(p => p.payment_status === 'pending').length;

    if (nullPaymentIntents > 0) {
      console.log('\n❌ WEBHOOK IS NOT WORKING!');
      console.log(`   Found ${nullPaymentIntents} transaction(s) with NULL payment_intent_id\n`);
      console.log('   Possible causes:');
      console.log('   1. Stripe CLI not running');
      console.log('   2. Webhook endpoint not receiving events');
      console.log('   3. Webhook signature verification failing');
      console.log('   4. Error in handleSuccessfulPayment function');
      console.log('\n   To fix:');
      console.log('   1. Make sure backend is running: npm start');
      console.log('   2. Start Stripe CLI:');
      console.log('      stripe listen --forward-to localhost:3000/api/payment/stripe/webhook');
      console.log('   3. Copy the webhook secret from CLI output to .env');
      console.log('   4. Restart backend');
      console.log('   5. Make a test payment and watch backend logs');
    } else if (pendingPayments > 0) {
      console.log('\n⚠️  PARTIAL SUCCESS');
      console.log(`   ${pendingPayments} purchase(s) still pending\n`);
      console.log('   Check if you tested with Stripe CLI running');
    } else if (transactions.length > 0) {
      console.log('\n✅ EVERYTHING LOOKS GOOD!');
      console.log('   All transactions have payment intent IDs');
      console.log('   All purchases are completed');
    } else {
      console.log('\n📝 NO DATA YET');
      console.log('   Make your first test purchase to see data here');
    }

    console.log('\n' + '='.repeat(60));
    console.log('');

    // Quick fix suggestions
    if (nullPaymentIntents > 0 && transactions.length > 0) {
      const latestTransaction = transactions[0];
      console.log('💡 QUICK FIX FOR EXISTING PENDING TRANSACTIONS:\n');
      console.log('   If payment was successful in Stripe but webhook failed,');
      console.log('   you can manually process it with this command:\n');
      console.log(`   node test-webhook-processing.js ${latestTransaction.stripe_session_id}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
