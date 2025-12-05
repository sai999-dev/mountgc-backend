const prisma = require('../config/prisma');
const { hashPassword } = require('../utils/password.utils');

const createUser = async (userData) => {
  // Business logic: Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: userData.email },
        { username: userData.username }
      ]
    }
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword
    }
  });

  return newUser;
};

module.exports = {
  createUser
};
