const crypto = require('crypto');

// Generate random verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Calculate token expiry (24 hours from now)
const getTokenExpiry = () => {
  const now = new Date();
  return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
};

module.exports = {
  generateVerificationToken,
  getTokenExpiry,
};
