const crypto = require('crypto');

/**
 * Generate unique device ID from user agent and IP
 */
const generateDeviceId = (userAgent, ipAddress) => {
  const deviceString = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(deviceString).digest('hex');
};

/**
 * Parse user agent to extract device information
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      deviceName: 'Unknown Device',
      deviceType: 'unknown',
      browser: 'Unknown',
      os: 'Unknown'
    };
  }

  // Detect device type
  let deviceType = 'desktop';
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  // Detect browser
  let browser = 'Unknown';
  if (/edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/chrome/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/mac/i.test(userAgent)) {
    os = 'MacOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/ios|iphone|ipad/i.test(userAgent)) {
    os = 'iOS';
  }

  // Create device name
  const deviceName = `${browser} on ${os}`;

  return {
    deviceName,
    deviceType,
    browser,
    os
  };
};

/**
 * Extract client IP address from request
 */
const getClientIp = (req) => {
  // Check various headers for real IP (useful behind proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.ip || req.connection.remoteAddress || 'Unknown';
};

/**
 * Get complete device information from request
 */
const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = getClientIp(req);
  const deviceId = generateDeviceId(userAgent, ipAddress);
  const deviceInfo = parseUserAgent(userAgent);

  return {
    deviceId,
    deviceName: deviceInfo.deviceName,
    deviceType: deviceInfo.deviceType,
    ipAddress,
    userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os
  };
};

/**
 * Validate if device ID matches current request
 */
const validateDeviceId = (req, storedDeviceId) => {
  const currentDeviceInfo = getDeviceInfo(req);
  return currentDeviceInfo.deviceId === storedDeviceId;
};

module.exports = {
  generateDeviceId,
  parseUserAgent,
  getClientIp,
  getDeviceInfo,
  validateDeviceId
};
