const bookingRepository = require('../../dal/repositories/booking.repository');
const timeslotRepository = require('../../dal/repositories/timeslot.repository');
const emailService = require('../../services/student/book.email.service');
const zoomService = require('../../services/student/zoom.service');

const createBooking = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const { name, email, phone, category, sessionType, timezone, bookingDate, bookingTime, message } = req.body;

    if (!name || !email || !category || !sessionType || !timezone || !bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: 'All booking details are required'
      });
    }

    const existingBooking = await bookingRepository.findByDateAndTime(bookingDate, bookingTime, userId);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    const booking = await bookingRepository.create({
      name,
      email,
      phone: phone || null,
      category,
      session_type: sessionType,
      timezone,
      booking_date: new Date(bookingDate),
      booking_time: bookingTime,
      message: message || null,
      status: 'pending'
    }, userId);

    const zoomData = zoomService.generateZoomLink(booking);

    const emailData = {
      ...booking,
      zoomLink: zoomData.meetingLink,
      meetingId: zoomData.meetingId,
      password: zoomData.password
    };

    Promise.all([
      emailService.sendBookingConfirmation(emailData),
      emailService.sendAdminNotification(emailData)
    ]).then(() => {
      console.log('✅ All emails sent successfully');
    }).catch((error) => {
      console.error('⚠️ Some emails failed to send:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully! Check your email for confirmation and Zoom link.',
      data: {
        ...booking,
        zoomLink: zoomData.displayLink
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const { date, timezone } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date is required' 
      });
    }

    if (!timezone) {
      return res.status(400).json({
        success: false,
        message: 'Timezone is required'
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

    const activeSlots = await timeslotRepository.findActiveByTimezone(timezoneCode);
    const allSlots = activeSlots.map(slot => slot.time);

    const bookedSlots = await bookingRepository.findAll({
      booking_date: new Date(date),
      status: { not: 'cancelled' }
    });

    const bookedTimes = bookedSlots.map(slot => slot.booking_time);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json({ 
      success: true, 
      data: { 
        date,
        timezone: timezoneCode,
        availableSlots, 
        bookedSlots: bookedTimes 
      } 
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const bookings = await bookingRepository.findAll({ email }, userId);

    res.status(200).json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const cancelMyBooking = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { email } = req.body;

    const booking = await bookingRepository.findById(id, userId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (email && booking.email !== email) {
      return res.status(403).json({ success: false, message: 'Email does not match booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const updatedBooking = await bookingRepository.update(id, { status: 'cancelled' }, userId);

    res.status(200).json({ 
      success: true, 
      message: 'Booking cancelled successfully', 
      data: updatedBooking 
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const convertISTtoCST = (timeString) => {
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return timeString;

  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2];
  const period = timeMatch[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  hours = hours - 10.5;

  if (hours < 0) hours += 24;
  if (hours >= 24) hours -= 24;

  const cstPeriod = hours >= 12 ? 'PM' : 'AM';
  const cstHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);

  return `${cstHours}:${minutes} ${cstPeriod}`;
};

const getAllBookings = async (req, res) => {
  try {
    const userId = req.user?.userId || null;
    const bookings = await bookingRepository.findAll({}, userId);
    
    const bookingsWithZoomAndCST = bookings.map(booking => {
      const zoomData = zoomService.generateZoomLink(booking);
      
      let displayTime = booking.booking_time;
      let originalTimezone = booking.timezone;
      
      if (booking.timezone && (booking.timezone.includes('IST') || booking.timezone.includes('Kolkata'))) {
        displayTime = convertISTtoCST(booking.booking_time);
        originalTimezone = 'IST';
      } else if (booking.timezone && (booking.timezone.includes('CST') || booking.timezone.includes('Chicago'))) {
        originalTimezone = 'CST';
      }
      
      return {
        ...booking,
        booking_time_cst: displayTime,
        original_timezone: originalTimezone,
        original_time: booking.booking_time,
        zoom_link: zoomData.meetingLink,
        zoom_meeting_id: zoomData.meetingId,
        zoom_password: zoomData.password
      };
    });
    
    res.status(200).json({
      success: true,
      data: bookingsWithZoomAndCST
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  createBooking,
  getAvailableSlots,
  getMyBookings,
  cancelMyBooking,
  getAllBookings
};
