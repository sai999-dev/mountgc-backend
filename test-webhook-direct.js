/**
 * Direct webhook test - simulates a real Stripe webhook
 * Run this to test webhook processing without Stripe CLI
 */

require('dotenv').config();
const axios = require('axios');

const testSessionData = {
  id: 'evt_test_webhook_' + Date.now(),
  object: 'event',
  type: 'checkout.session.completed',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_a1b2c3d4e5f6',
      object: 'checkout.session',
      amount_total: 100000, // $1000 or ₹1000
      currency: 'usd',
      customer_email: 'test@example.com',
      payment_intent: 'pi_test_payment_intent_123',
      payment_status: 'paid',
      payment_method_types: ['card'],
      status: 'complete',
      metadata: {
        userId: '1',
        serviceType: 'research_paper',
        serviceId: '1',
      }
    }
  }
};

async function testWebhook() {
  console.log('🧪 Testing Webhook Processing\n');
  console.log('Sending test event to webhook endpoint...');
  console.log('Event type:', testSessionData.type);
  console.log('Session ID:', testSessionData.data.object.id);
  console.log('Payment Intent:', testSessionData.data.object.payment_intent);
  console.log('\n');

  try {
    // This will fail signature verification, but we can see if the endpoint is reachable
    const response = await axios.post(
      'http://localhost:3000/api/payment/stripe/webhook',
      testSessionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        },
        validateStatus: () => true // Don't throw on any status
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

    if (response.status === 400 && response.data.message?.includes('signature')) {
      console.log('\n✅ Webhook endpoint is reachable!');
      console.log('❌ But signature verification failed (expected in this test)');
      console.log('\n📝 This means your webhook route is working, but you need Stripe CLI for real testing.');
    } else if (response.status === 200) {
      console.log('\n✅ Webhook processed successfully!');
    } else {
      console.log('\n❌ Unexpected response');
    }
  } catch (error) {
    console.error('\n❌ Error calling webhook:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Is your backend server running on port 3000?');
      console.error('   Start it with: npm start');
    }
  }
}

testWebhook();
