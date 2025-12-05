/**
 * Test script to verify webhook processing
 * Run this to manually trigger a test webhook event
 */

require('dotenv').config();
const stripeService = require('./src/services/stripe.service');

// Sample checkout.session.completed event
const testEvent = {
  id: 'evt_test_123',
  type: 'checkout.session.completed',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_123',
      payment_intent: 'pi_test_123',
      payment_status: 'paid',
      amount_total: 100000, // $1000 or ₹1000
      metadata: {
        userId: '1',
        serviceType: 'research_paper', // or 'visa_application'
        serviceId: '1',
      }
    }
  }
};

console.log('🧪 Testing webhook event processing...\n');
console.log('Event type:', testEvent.type);
console.log('Session ID:', testEvent.data.object.id);
console.log('Metadata:', testEvent.data.object.metadata);
console.log('\n⚙️ Processing...\n');

stripeService.handleWebhookEvent(testEvent)
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
