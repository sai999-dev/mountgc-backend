const prisma = require('../../config/prisma');

class TimeslotRepository {
// Find all timeslots
async findAll(userId) {
return await prisma.timeslot.findMany({
orderBy: [
{ timezone: 'asc' },
{ time: 'asc' }
]
});
}

// Find active timeslots
async findActive() {
return await prisma.timeslot.findMany({
where: { is_active: true },
orderBy: [
{ timezone: 'asc' },
{ time: 'asc' }
]
});
}

// Find timeslots by timezone
async findByTimezone(timezone, userId) {
return await prisma.timeslot.findMany({
where: { timezone },
orderBy: { time: 'asc' }
});
}

// Find active timeslots by timezone
async findActiveByTimezone(timezone) {
return await prisma.timeslot.findMany({
where: {
timezone,
is_active: true
},
orderBy: { time: 'asc' }
});
}

// Find by time (for backward compatibility)
async findByTime(time, userId) {
return await prisma.timeslot.findFirst({
where: { time }
});
}

// Find by time AND timezone
async findByTimeAndTimezone(time, timezone, userId) {
return await prisma.timeslot.findFirst({
where: {
time,
timezone
}
});
}

// Find by ID
async findById(id, userId) {
return await prisma.timeslot.findUnique({
where: { timeslot_id: parseInt(id) }
});
}

// Create timeslot
async create(data, userId) {
return await prisma.timeslot.create({
data: {
time: data.time,
timezone: data.timezone || 'IST',
is_active: data.is_active !== undefined ? data.is_active : true
}
});
}

// Update timeslot
async update(id, data, userId) {
return await prisma.timeslot.update({
where: { timeslot_id: parseInt(id) },
data
});
}

// Delete timeslot
async delete(id, userId) {
return await prisma.timeslot.delete({
where: { timeslot_id: parseInt(id) }
});
}
}

module.exports = new TimeslotRepository();