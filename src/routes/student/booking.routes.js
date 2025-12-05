const express = require('express');
const router = express.Router();

const bookingController = require('../../controllers/student/booking.controller');

// DEBUG: Check what's imported
console.log('📦 Imported from booking.controller:', bookingController);
console.log('createBooking:', typeof bookingController.createBooking);
console.log('getAvailableSlots:', typeof bookingController.getAvailableSlots);
console.log('getMyBookings:', typeof bookingController.getMyBookings);
console.log('cancelMyBooking:', typeof bookingController.cancelMyBooking);

const {
  createBooking,
  getAvailableSlots,
  getMyBookings,
  cancelMyBooking
} = bookingController;

// Public routes
router.post('/', createBooking);
router.get('/available-slots', getAvailableSlots);
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelMyBooking);

module.exports = router;
