const express = require('express');
const router = express.Router();

const {
  getAllTimeSlots,
  getActiveTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  toggleTimeSlotStatus
} = require('../../controllers/admin/timeslot.controller');

// Public route - Get active time slots
router.get('/active', getActiveTimeSlots);

// Admin routes - authenticateAdmin already applied at parent level
router.get('/', getAllTimeSlots);
router.post('/', createTimeSlot);
router.put('/:id', updateTimeSlot);
router.delete('/:id', deleteTimeSlot);
router.patch('/:id/toggle', toggleTimeSlotStatus);

module.exports = router;
