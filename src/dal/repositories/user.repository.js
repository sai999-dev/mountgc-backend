const BaseDal = require('../base.dal');
const prisma = require('../../config/prisma');

class UserRepository extends BaseDal {
  constructor() {
    super('User');
  }

  // Validation rules for user creation
  createUserRules = {
    username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
    email: { required: true, type: 'string', maxLength: 100 },
    password: { required: true, type: 'string', minLength: 6 }
  };

  async findByEmail(email, userId = null) {
    await this.checkRateLimit(userId || email, 'findByEmail', 50);
    
    const sanitizedEmail = this.sanitizeQuery({ email }).email;

    return this.executeQuery('findByEmail', async () => {
      return await prisma.user.findUnique({
        where: { email: sanitizedEmail }
      });
    }, userId);
  }

  async findById(id, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findById', 100);

    return this.executeQuery('findById', async () => {
      return await prisma.user.findUnique({
        where: { user_id: parseInt(id) }
      });
    }, userId);
  }

  async create(data, userId = null) {
    this.validateInput(data, this.createUserRules);
    await this.checkRateLimit(data.email, 'create', 5, 3600000); // 5 per hour

    const sanitizedData = this.sanitizeQuery(data);

    return this.executeQuery('create', async () => {
      return await prisma.user.create({
        data: sanitizedData
      });
    }, userId);
  }

  async update(id, data, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'update', 20);

    const sanitizedData = this.sanitizeQuery(data);

    return this.executeQuery('update', async () => {
      return await prisma.user.update({
        where: { user_id: parseInt(id) },
        data: sanitizedData
      });
    }, userId);
  }

  async updateRefreshToken(userId, refreshToken) {
    await this.checkRateLimit(userId, 'updateRefreshToken', 50);

    return this.executeQuery('updateRefreshToken', async () => {
      return await prisma.user.update({
        where: { user_id: parseInt(userId) },
        data: { 
          refresh_token: refreshToken,
          last_login_at: new Date()
        }
      });
    }, userId);
  }

  async findByVerificationToken(token) {
    await this.checkRateLimit('verification', 'findByToken', 50);

    return this.executeQuery('findByVerificationToken', async () => {
      return await prisma.user.findFirst({
        where: { verification_token: token }
      });
    });
  }
}

module.exports = new UserRepository();
