const express = require('express');
const router = express.Router();

// Import student routes
const bookingRoutes = require('./booking.routes');
const researchPaperRoutes = require('./research-paper.routes');
const visaApplicationRoutes = require('./visa-application.routes');
const counsellingRoutes = require('./counselling.routes');
const termsRoutes = require('./terms.routes');

// Register student routes
router.use('/bookings', bookingRoutes);
router.use('/research-papers', researchPaperRoutes);
router.use('/visa-applications', visaApplicationRoutes);
router.use('/counselling', counsellingRoutes);
router.use('/', termsRoutes); // /api/student/terms/:service_type and /api/student/agreement/...

module.exports = router;
