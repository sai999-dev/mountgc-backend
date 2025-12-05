const BaseDal = require('../base.dal');
const prisma = require('../../config/prisma');

class BookingRepository extends BaseDal {
  constructor() {
    super('Booking');
  }

  createBookingRules = {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'string', maxLength: 100 },
    category: { required: true, type: 'string' },
    session_type: { required: true, type: 'string' },
    booking_time: { required: true, type: 'string' }
  };

  async create(data, userId = null) {
    this.validateInput(data, this.createBookingRules);
    await this.checkRateLimit(data.email, 'createBooking', 5, 3600000); // 5 bookings per hour

    const sanitizedData = this.sanitizeQuery(data);

    return this.executeQuery('createBooking', async () => {
      return await prisma.booking.create({
        data: sanitizedData
      });
    }, userId || data.email);
  }

  async findByDateAndTime(date, time, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findByDateAndTime', 100);

    return this.executeQuery('findByDateAndTime', async () => {
      return await prisma.booking.findFirst({
        where: {
          booking_date: new Date(date),
          booking_time: time,
          status: { not: 'cancelled' }
        }
      });
    }, userId);
  }

  async findAll(filters = {}, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findAllBookings', 50);

    const sanitizedFilters = this.sanitizeQuery(filters);

    return this.executeQuery('findAllBookings', async () => {
      return await prisma.booking.findMany({
        where: sanitizedFilters,
        orderBy: { booking_date: 'desc' }
      });
    }, userId);
  }

  async findById(id, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findBookingById', 100);

    return this.executeQuery('findBookingById', async () => {
      return await prisma.booking.findUnique({
        where: { booking_id: parseInt(id) }
      });
    }, userId);
  }

  async update(id, data, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'updateBooking', 50);

    const sanitizedData = this.sanitizeQuery(data);

    return this.executeQuery('updateBooking', async () => {
      return await prisma.booking.update({
        where: { booking_id: parseInt(id) },
        data: sanitizedData
      });
    }, userId);
  }

  async delete(id, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'deleteBooking', 10);

    return this.executeQuery('deleteBooking', async () => {
      return await prisma.booking.delete({
        where: { booking_id: parseInt(id) }
      });
    }, userId);
  }
}

module.exports = new BookingRepository();
