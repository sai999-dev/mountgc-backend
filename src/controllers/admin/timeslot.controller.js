const timeslotRepository = require('../../dal/repositories/timeslot.repository');

const getAllTimeSlots = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { timezone } = req.query;
    let timeSlots;
    if (timezone) {
      timeSlots = await timeslotRepository.findByTimezone(timezone, userId);
    } else {
      timeSlots = await timeslotRepository.findAll(userId);
    }
    res.status(200).json({ success: true, data: timeSlots });
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getActiveTimeSlots = async (req, res) => {
  try {
    const { timezone } = req.query;
    if (!timezone || !['IST', 'CST'].includes(timezone)) {
      return res.status(400).json({ success: false, message: 'Valid timezone is required (IST or CST)' });
    }
    const timeSlots = await timeslotRepository.findActiveByTimezone(timezone);
    res.status(200).json({ success: true, data: timeSlots, timezone: timezone });
  } catch (error) {
    console.error('Get active time slots error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const createTimeSlot = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { time, timezone } = req.body;
    if (!time) {
      return res.status(400).json({ success: false, message: 'Time is required' });
    }
    if (!timezone || !['IST', 'CST'].includes(timezone)) {
      return res.status(400).json({ success: false, message: 'Valid timezone is required (IST or CST)' });
    }
    const existingSlot = await timeslotRepository.findByTimeAndTimezone(time, timezone, userId);
    if (existingSlot) {
      return res.status(409).json({ success: false, message: `Time slot ${time} already exists for ${timezone}` });
    }
    const timeSlot = await timeslotRepository.create({ time, timezone }, userId);
    res.status(201).json({ success: true, message: 'Time slot created successfully', data: timeSlot });
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const updateTimeSlot = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { time, timezone, is_active } = req.body;
    const updateData = {};
    if (time !== undefined) updateData.time = time;
    if (timezone !== undefined) {
      if (!['IST', 'CST'].includes(timezone)) {
        return res.status(400).json({ success: false, message: 'Invalid timezone. Must be IST or CST' });
      }
      updateData.timezone = timezone;
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    const timeSlot = await timeslotRepository.update(id, updateData, userId);
    res.status(200).json({ success: true, message: 'Time slot updated successfully', data: timeSlot });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const deleteTimeSlot = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    await timeslotRepository.delete(id, userId);
    res.status(200).json({ success: true, message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const toggleTimeSlotStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const timeSlot = await timeslotRepository.findById(id, userId);
    if (!timeSlot) {
      return res.status(404).json({ success: false, message: 'Time slot not found' });
    }
    const updated = await timeslotRepository.update(id, { is_active: !timeSlot.is_active }, userId);
    res.status(200).json({ success: true, message: `Time slot ${updated.is_active ? 'activated' : 'deactivated'} successfully`, data: updated });
  } catch (error) {
    console.error('Toggle time slot error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = { getAllTimeSlots, getActiveTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot, toggleTimeSlotStatus };
