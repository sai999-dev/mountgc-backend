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

const { authenticateToken } = require('../../middleware/auth.middleware');

// Public route - Get active time slots
router.get('/active', getActiveTimeSlots);

// Admin routes
router.get('/', authenticateToken, getAllTimeSlots);
router.post('/', authenticateToken, createTimeSlot);
router.put('/:id', authenticateToken, updateTimeSlot);
router.delete('/:id', authenticateToken, deleteTimeSlot);
router.patch('/:id/toggle', authenticateToken, toggleTimeSlotStatus);

module.exports = router;
