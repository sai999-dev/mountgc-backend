const { verifyAdminToken } = require('../utils/jwt.utils');

/**
 * Middleware to authenticate admin requests
 */
const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyAdminToken(token);

    if (!decoded) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired admin token'
      });
    }

    // Attach admin info to request
    req.admin = {
      email: decoded.email,
      role: decoded.role
    };

    // Also set req.user for backward compatibility with controllers that expect it
    // Admin users don't have userId in database, so we use email as identifier
    req.user = {
      email: decoded.email,
      role: decoded.role,
      userId: null // Admins don't have user_id in the users table
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = {
  authenticateAdmin
};
