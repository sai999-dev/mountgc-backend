const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../../middleware/auth.middleware');

// Import only the routes that exist
const timeslotRoutes = require('./timeslot.routes');
const researchPaperRoutes = require('./research-paper.routes');
const visaApplicationRoutes = require('./visa-application.routes');
const termsRoutes = require('./terms.routes');
const { getAllBookings } = require('../../controllers/student/booking.controller');
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../../controllers/user.controller');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(authorizeRole('admin'));

// Register admin routes
router.use('/timeslots', timeslotRoutes);
router.use('/research-papers', researchPaperRoutes);
router.use('/visa-applications', visaApplicationRoutes);
router.use('/', termsRoutes); // /api/admin/terms/... and /api/admin/agreements/...
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;

