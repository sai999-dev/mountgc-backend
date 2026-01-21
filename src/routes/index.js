const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { authenticateAdmin } = require('../middleware/admin-auth.middleware');

console.log('🔍 Loading routes...');

const authRoutes = require('./auth.routes');
const adminAuthRoutes = require('./admin-auth.routes');
const userRoutes = require('./user.routes');
const studentBookingRoutes = require('./student/booking.routes');
const studentRoutes = require('./student');
const adminRoutes = require('./admin');
const stripeRoutes = require('./payment/stripe.routes');
const counsellingRoutes = require('./counselling.routes');

router.use('/auth', authRoutes);
router.use('/admin-auth', adminAuthRoutes);
router.use('/user', userRoutes);
router.use('/bookings', studentBookingRoutes);
router.use('/student', studentRoutes);
router.use('/payment/stripe', stripeRoutes);
router.use('/counselling', counsellingRoutes);

router.get('/timeslots/active', async (req, res) => {
  try {
    const { timezone } = req.query;
    
    if (!timezone) {
      return res.status(400).json({
        success: false,
        message: 'Timezone parameter required (?timezone=IST or ?timezone=CST)'
      });
    }

    let timezoneCode;
    if (timezone.includes('IST') || timezone.includes('Kolkata')) {
      timezoneCode = 'IST';
    } else if (timezone.includes('CST') || timezone.includes('Chicago')) {
      timezoneCode = 'CST';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid timezone format'
      });
    }

    const timeslotRepository = require('../dal/repositories/timeslot.repository');
    const timeSlots = await timeslotRepository.findActiveByTimezone(timezoneCode);
    
    res.json({ 
      success: true, 
      data: timeSlots,
      timezone: timezoneCode
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use('/admin', authenticateAdmin, adminRoutes);

console.log('✅ Routes loaded successfully');

module.exports = router;
