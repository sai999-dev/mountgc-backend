const jwt = require('jsonwebtoken');

// Default token expiration times
const DEFAULT_ACCESS_TOKEN_EXPIRY = '7d';  // 7 days for student convenience
const DEFAULT_REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

// Generate access token (longer-lived for better UX)
const generateAccessToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRY }
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_TOKEN_EXPIRY }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate long-lived admin access token (30 days, no refresh needed)
const generateAdminAccessToken = (email) => {
  return jwt.sign(
    { email, role: 'admin', type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // Long-lived token for admin
  );
};

// Verify admin token
const verifyAdminToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verify it's an admin token
    if (decoded.type === 'admin' && decoded.role === 'admin') {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAdminAccessToken,
  verifyAdminToken
};
