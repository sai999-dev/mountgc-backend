const prisma = require('../config/prisma');

class BaseDal {
  constructor(model) {
    this.model = model;
    this.queryLog = [];
    this.rateLimitStore = new Map(); // Store rate limits in memory
  }

  // Log all queries for audit
  logQuery(operation, data, userId = null) {
    const log = {
      timestamp: new Date().toISOString(),
      operation,
      model: this.model,
      userId,
      success: true
    };
    this.queryLog.push(log);
    console.log(`🔍 [DAL] ${operation} on ${this.model} by user ${userId || 'anonymous'}`);
  }

  // Validate input before any operation
  validateInput(data, rules) {
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        throw new Error(`Field '${field}' is required`);
      }
      if (rule.type && data[field] && typeof data[field] !== rule.type) {
        throw new Error(`Field '${field}' must be of type ${rule.type}`);
      }
      if (rule.maxLength && data[field] && data[field].length > rule.maxLength) {
        throw new Error(`Field '${field}' exceeds maximum length of ${rule.maxLength}`);
      }
      if (rule.minLength && data[field] && data[field].length < rule.minLength) {
        throw new Error(`Field '${field}' must be at least ${rule.minLength} characters`);
      }
    }
  }

  // Rate limiting check (simple in-memory implementation)
  async checkRateLimit(identifier, operation, limit = 100, timeWindow = 60000) {
    const key = `${identifier}_${operation}`;
    const now = Date.now();
    
    const userRequests = this.rateLimitStore.get(key) || [];
    const recentRequests = userRequests.filter(time => now - time < timeWindow);

    if (recentRequests.length >= limit) {
      console.log(`⚠️ [DAL] Rate limit exceeded for ${identifier} on ${operation}`);
      throw new Error(`Rate limit exceeded. Please try again later.`);
    }

    recentRequests.push(now);
    this.rateLimitStore.set(key, recentRequests);

    // Clean up old entries periodically
    if (recentRequests.length > limit * 2) {
      this.rateLimitStore.set(key, recentRequests.slice(-limit));
    }
  }

  // Sanitize query parameters
  sanitizeQuery(query) {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const sanitized = { ...query };
    
    // Fields that should skip SQL injection checking (contain legitimate special characters)
    const skipValidationFields = ['user_agent', 'access_token', 'refresh_token', 'message'];
    
    // Remove potential SQL injection attempts
    const dangerousPatterns = [
      /(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bEXEC\b|\bEXECUTE\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\bUNION\b.*\bSELECT\b)/gi,
      /(\bINSERT\b.*\bINTO\b)/gi,
      /(\bUPDATE\b.*\bSET\b)/gi
    ];

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        // Skip validation for safe fields (tokens, user agents, etc.)
        if (!skipValidationFields.includes(key)) {
          dangerousPatterns.forEach(pattern => {
            if (pattern.test(sanitized[key])) {
              console.log(`⚠️ [DAL] Dangerous pattern detected in field '${key}'`);
              throw new Error('Invalid or potentially dangerous input detected');
            }
          });
        }
        // Trim whitespace (but not for tokens/user agents)
        if (!skipValidationFields.includes(key)) {
          sanitized[key] = sanitized[key].trim();
        }
      }
    });

    return sanitized;
  }

  // Error handling wrapper
  async executeQuery(operation, queryFn, userId = null) {
    try {
      this.logQuery(operation, 'Starting', userId);
      const result = await queryFn();
      this.logQuery(operation, 'Success', userId);
      return result;
    } catch (error) {
      console.error(`❌ [DAL Error] ${operation} on ${this.model}:`, error.message);
      throw error;
    }
  }

  // Get audit logs (optional - for debugging)
  getAuditLogs() {
    return this.queryLog;
  }
}

module.exports = BaseDal;
