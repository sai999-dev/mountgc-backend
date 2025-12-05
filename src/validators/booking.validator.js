const { body, query, validationResult } = require('express-validator');

// Validation for creating booking (no login required)
const createBookingValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional(),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['General', 'Visa Assistance', 'Profile Review', 'University Shortlisting'])
    .withMessage('Invalid category'),
  body('sessionType')
    .notEmpty()
    .withMessage('Session type is required')
    .isIn(['General Counseling', 'Expert Counseling'])
    .withMessage('Invalid session type'),
  body('timezone')
    .notEmpty()
    .withMessage('Timezone is required'),
  body('bookingDate')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('bookingTime')
    .notEmpty()
    .withMessage('Booking time is required')
];

// Validation for updating booking status
const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

// Validation for getting available slots
const availableSlotsValidator = [
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
];

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  createBookingValidator,
  updateStatusValidator,
  availableSlotsValidator,
  validate
};
