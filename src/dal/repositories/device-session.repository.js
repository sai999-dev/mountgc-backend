const BaseDal = require('../base.dal');
const prisma = require('../../config/prisma');

class DeviceSessionRepository extends BaseDal {
  constructor() {
    super('DeviceSession');
  }

  createSessionRules = {
    user_id: { required: true, type: 'number' },
    device_id: { required: true, type: 'string', minLength: 10 },
    access_token: { required: true, type: 'string' },
    refresh_token: { required: true, type: 'string' }
  };

  /**
   * Create new device session
   */
  async create(data, userId = null) {
    this.validateInput(data, this.createSessionRules);
    await this.checkRateLimit(data.user_id, 'createSession', 10, 60000); // 10 per minute

    const sanitizedData = this.sanitizeQuery(data);

    return this.executeQuery('createDeviceSession', async () => {
      return await prisma.deviceSession.create({
        data: sanitizedData
      });
    }, userId || data.user_id);
  }

  /**
   * Find active session by user ID
   */
  async findActiveByUserId(userId) {
    await this.checkRateLimit(userId, 'findActiveSession', 100);

    return this.executeQuery('findActiveSession', async () => {
      return await prisma.deviceSession.findFirst({
        where: {
          user_id: parseInt(userId),
          is_active: true
        },
        orderBy: {
          login_at: 'desc'
        }
      });
    }, userId);
  }

  /**
   * Find active session by device ID
   */
  async findActiveByDeviceId(deviceId, userId) {
    await this.checkRateLimit(userId || 'anonymous', 'findByDeviceId', 100);

    return this.executeQuery('findActiveByDeviceId', async () => {
      return await prisma.deviceSession.findFirst({
        where: {
          device_id: deviceId,
          is_active: true
        }
      });
    }, userId);
  }

  /**
   * Find session by access token
   */
  async findByAccessToken(accessToken, userId = null) {
    // Use a hash of the token as rate limit key to avoid all requests sharing same limit
    const rateLimitKey = userId || `token_${accessToken.substring(0, 20)}`;
    await this.checkRateLimit(rateLimitKey, 'findByToken', 200);

    return this.executeQuery('findByAccessToken', async () => {
      return await prisma.deviceSession.findFirst({
        where: {
          access_token: accessToken,
          is_active: true
        }
      });
    }, userId);
  }

  /**
   * Invalidate all active sessions for a user (force logout previous devices)
   */
  async invalidateUserSessions(userId) {
    await this.checkRateLimit(userId, 'invalidateSessions', 20);

    return this.executeQuery('invalidateUserSessions', async () => {
      const userIdInt = parseInt(userId);
      console.log(`🔍 Looking for active sessions for user ${userIdInt}`);

      // First, find all active sessions to see what we're updating
      const activeSessions = await prisma.deviceSession.findMany({
        where: {
          user_id: userIdInt,
          is_active: true
        }
      });

      console.log(`📋 Found ${activeSessions.length} active session(s) to invalidate`);

      // Now update them
      const result = await prisma.deviceSession.updateMany({
        where: {
          user_id: userIdInt,
          is_active: true
        },
        data: {
          is_active: false,
          logout_at: new Date()
        }
      });

      console.log(`✅ Updated ${result.count} session(s) in database`);

      // Verify the update worked
      const stillActive = await prisma.deviceSession.findMany({
        where: {
          user_id: userIdInt,
          is_active: true
        }
      });

      if (stillActive.length > 0) {
        console.error(`❌ WARNING: ${stillActive.length} session(s) still active after update!`);
      } else {
        console.log(`✅ Verified: All sessions invalidated successfully`);
      }

      return result;
    }, userId);
  }

  /**
   * Invalidate specific session
   */
  async invalidateSession(sessionId, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'invalidateSession', 50);

    return this.executeQuery('invalidateSession', async () => {
      const sessionIdInt = parseInt(sessionId);
      console.log(`🔍 Invalidating session ${sessionIdInt}`);

      const result = await prisma.deviceSession.update({
        where: {
          session_id: sessionIdInt
        },
        data: {
          is_active: false,
          logout_at: new Date()
        }
      });

      console.log(`✅ Session ${sessionIdInt} invalidated - is_active: ${result.is_active}, logout_at: ${result.logout_at}`);

      return result;
    }, userId);
  }

  /**
   * Update session activity timestamp
   */
  async updateActivity(sessionId, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'updateActivity', 200);

    return this.executeQuery('updateActivity', async () => {
      return await prisma.deviceSession.update({
        where: {
          session_id: parseInt(sessionId)
        },
        data: {
          last_activity_at: new Date()
        }
      });
    }, userId);
  }

  /**
   * Get all sessions for a user
   */
  async findAllByUserId(userId) {
    await this.checkRateLimit(userId, 'findAllSessions', 50);

    return this.executeQuery('findAllByUserId', async () => {
      return await prisma.deviceSession.findMany({
        where: {
          user_id: parseInt(userId)
        },
        orderBy: {
          login_at: 'desc'
        }
      });
    }, userId);
  }

  /**
   * Clean up old inactive sessions (older than 30 days)
   */
  async cleanupOldSessions() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.executeQuery('cleanupOldSessions', async () => {
      return await prisma.deviceSession.deleteMany({
        where: {
          is_active: false,
          logout_at: {
            lt: thirtyDaysAgo
          }
        }
      });
    });
  }
}

module.exports = new DeviceSessionRepository();
