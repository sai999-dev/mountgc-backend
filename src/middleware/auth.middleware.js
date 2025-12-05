const { verifyAccessToken } = require('../utils/jwt.utils');
const deviceSessionRepository = require('../dal/repositories/device-session.repository');
const { validateDeviceId } = require('../utils/device.utils');

// Middleware to protect routes with device session validation
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token is required' 
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }

  try {
    // Validate device session
    const session = await deviceSessionRepository.findByAccessToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found. Please login again.',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Session has been terminated. Please login again.',
        code: 'SESSION_TERMINATED'
      });
    }

    // Validate device ID matches
    const isValidDevice = validateDeviceId(req, session.device_id);
    if (!isValidDevice) {
      // Device mismatch - possible token theft
      await deviceSessionRepository.invalidateSession(session.session_id);
      return res.status(403).json({
        success: false,
        message: 'Device verification failed. Session terminated for security.',
        code: 'DEVICE_MISMATCH'
      });
    }

    // Update last activity timestamp
    await deviceSessionRepository.updateActivity(session.session_id, decoded.userId);

    // Attach user info and session to request
    req.user = decoded;
    req.session = session;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication validation failed',
      error: error.message
    });
  }
};

// Middleware to check user role
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions' 
      });
    }

    next();
  };
};

// Lenient middleware for logout - allows logout even if session is inactive
const authenticateTokenForLogout = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // For logout, we only need to know who the user is
  // We don't care if session is inactive or not found
  // This allows users to logout even if session was already invalidated
  req.user = decoded;
  next();
};

module.exports = {
  authenticateToken,
  authenticateTokenForLogout,
  authorizeRole
};
