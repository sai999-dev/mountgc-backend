require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index'); // ← CHANGE THIS (add /index)

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',  // Frontend for testing
    'http://localhost:3001',  // Student frontend
    'http://localhost:3002'   // Admin frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// IMPORTANT: Stripe webhook needs RAW body, so we register it BEFORE express.json()
// This must come before the global JSON middleware
const stripeController = require('./src/controllers/payment/stripe.controller');

// Webhook route with raw body parser
app.post(
  '/api/payment/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    console.log('🎯 WEBHOOK ROUTE HIT!');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Has body:', !!req.body);
    console.log('   Body type:', typeof req.body);
    console.log('   Body length:', req.body?.length);
    stripeController.handleStripeWebhook(req, res);
  }
);

// Middleware - applies to all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔍 Registering /api routes...');
app.use('/api', routes);
console.log('✅ Routes registered');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'MountGC Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*',
      documentation: 'See API documentation for available endpoints'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
  console.log('📋 Available routes:');
  console.log('   🔐 Auth Routes:');
  console.log('      POST /api/auth/signup');
  console.log('      POST /api/auth/login');
  console.log('      POST /api/auth/refresh-token');
  console.log('      POST /api/auth/logout');
  console.log('');
  console.log('   👨‍🎓 Student Routes (Public):');
  console.log('      POST /api/bookings');
  console.log('      GET  /api/bookings/available-slots');
  console.log('      GET  /api/timeslots/active');
  console.log('');
  console.log('   👨‍💼 Admin Routes (Protected):');
  console.log('      GET  /api/admin/dashboard/stats');
  console.log('      GET  /api/admin/bookings');
  console.log('      GET  /api/admin/timeslots');
  console.log('      GET  /api/admin/users');
});
