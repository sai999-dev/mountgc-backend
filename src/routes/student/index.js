const express = require('express');
const router = express.Router();

// Import student routes
const bookingRoutes = require('./booking.routes');
const researchPaperRoutes = require('./research-paper.routes');
const visaApplicationRoutes = require('./visa-application.routes');

// Register student routes
router.use('/bookings', bookingRoutes);
router.use('/research-papers', researchPaperRoutes);
router.use('/visa-applications', visaApplicationRoutes);

module.exports = router;
