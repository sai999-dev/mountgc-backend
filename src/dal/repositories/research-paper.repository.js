const BaseDal = require('../base.dal');
const prisma = require('../../config/prisma');

class ResearchPaperConfigRepository extends BaseDal {
  constructor() {
    super('researchPaperConfig');
  }

  /**
   * Get all research paper configurations
   */
  async findAll(userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findAllConfigs', 100);

    return this.executeQuery('findAllConfigs', async () => {
      return await prisma.researchPaperConfig.findMany({
        where: { is_active: true },
        orderBy: [
          { currency: 'asc' },
          { co_authors: 'asc' }
        ]
      });
    }, userId);
  }

  /**
   * Get configuration by currency and co-authors
   */
  async findByCurrencyAndCoAuthors(currency, coAuthors, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findConfigByCurrencyCoAuthors', 100);

    return this.executeQuery('findConfigByCurrencyCoAuthors', async () => {
      return await prisma.researchPaperConfig.findFirst({
        where: {
          currency: currency,
          co_authors: parseInt(coAuthors),
          is_active: true
        }
      });
    }, userId);
  }

  /**
   * Get all configurations for a specific currency
   */
  async findByCurrency(currency, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findConfigByCurrency', 100);

    return this.executeQuery('findConfigByCurrency', async () => {
      return await prisma.researchPaperConfig.findMany({
        where: {
          currency: currency,
          is_active: true
        },
        orderBy: { co_authors: 'asc' }
      });
    }, userId);
  }

  /**
   * Create or update configuration
   */
  async upsertConfig(data, userId = null) {
    const { currency, co_authors, ...configData } = data;
    await this.checkRateLimit(userId || 'anonymous', 'upsertConfig', 50);

    return this.executeQuery('upsertConfig', async () => {
      return await prisma.researchPaperConfig.upsert({
        where: {
          currency_co_authors: {
            currency: currency,
            co_authors: parseInt(co_authors)
          }
        },
        update: {
          ...configData,
          updated_at: new Date()
        },
        create: {
          currency,
          co_authors: parseInt(co_authors),
          ...configData
        }
      });
    }, userId);
  }

  /**
   * Update configuration
   */
  async updateConfig(configId, data, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'updateConfig', 50);

    return this.executeQuery('updateConfig', async () => {
      return await prisma.researchPaperConfig.update({
        where: { config_id: parseInt(configId) },
        data: {
          ...data,
          updated_at: new Date()
        }
      });
    }, userId);
  }

  /**
   * Delete (soft delete by setting is_active to false)
   */
  async softDelete(configId, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'softDeleteConfig', 10);

    return this.executeQuery('softDeleteConfig', async () => {
      return await prisma.researchPaperConfig.update({
        where: { config_id: parseInt(configId) },
        data: {
          is_active: false,
          updated_at: new Date()
        }
      });
    }, userId);
  }
}

class ResearchPaperPurchaseRepository extends BaseDal {
  constructor() {
    super('researchPaperPurchase');
  }

  /**
   * Create a new purchase
   */
  async createPurchase(data, userId = null) {
    await this.checkRateLimit(userId || data.email, 'createPurchase', 10, 3600000);

    return this.executeQuery('createPurchase', async () => {
      return await prisma.researchPaperPurchase.create({
        data: {
          ...data,
          user_id: parseInt(data.user_id),
          co_authors: parseInt(data.co_authors),
          actual_amount: parseFloat(data.actual_amount),
          discount_amount: parseFloat(data.discount_amount),
          final_amount: parseFloat(data.final_amount)
        }
      });
    }, userId || data.email);
  }

  /**
   * Get all purchases with user details
   */
  async findAllWithUsers(userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findAllPurchases', 50);

    return this.executeQuery('findAllPurchases', async () => {
      return await prisma.researchPaperPurchase.findMany({
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    }, userId);
  }

  /**
   * Get purchases by user ID
   */
  async findByUserId(userId) {
    await this.checkRateLimit(userId, 'findPurchasesByUserId', 100);

    return this.executeQuery('findPurchasesByUserId', async () => {
      return await prisma.researchPaperPurchase.findMany({
        where: { user_id: parseInt(userId) },
        orderBy: { created_at: 'desc' }
      });
    }, userId);
  }

  /**
   * Get purchase by ID with user details
   */
  async findByIdWithUser(purchaseId, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'findPurchaseById', 100);

    return this.executeQuery('findPurchaseById', async () => {
      return await prisma.researchPaperPurchase.findFirst({
        where: { purchase_id: parseInt(purchaseId) },
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              email: true
            }
          }
        }
      });
    }, userId);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(purchaseId, paymentData, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'updatePaymentStatus', 50);

    return this.executeQuery('updatePaymentStatus', async () => {
      return await prisma.researchPaperPurchase.update({
        where: { purchase_id: parseInt(purchaseId) },
        data: {
          payment_status: paymentData.payment_status,
          payment_id: paymentData.payment_id,
          payment_method: paymentData.payment_method,
          updated_at: new Date()
        }
      });
    }, userId);
  }

  /**
   * Update purchase status
   */
  async updateStatus(purchaseId, status, userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'updatePurchaseStatus', 50);

    return this.executeQuery('updatePurchaseStatus', async () => {
      return await prisma.researchPaperPurchase.update({
        where: { purchase_id: parseInt(purchaseId) },
        data: {
          status: status,
          updated_at: new Date()
        }
      });
    }, userId);
  }

  /**
   * Get statistics
   */
  async getStats(userId = null) {
    await this.checkRateLimit(userId || 'anonymous', 'getPurchaseStats', 50);

    return this.executeQuery('getPurchaseStats', async () => {
      const [totalPurchases, completedPayments, pendingPayments, totalRevenue] = await Promise.all([
        prisma.researchPaperPurchase.count({}),
        prisma.researchPaperPurchase.count({ where: { payment_status: 'completed' } }),
        prisma.researchPaperPurchase.count({ where: { payment_status: 'pending' } }),
        prisma.researchPaperPurchase.aggregate({
          where: { payment_status: 'completed' },
          _sum: { final_amount: true }
        })
      ]);

      return {
        totalPurchases,
        completedPayments,
        pendingPayments,
        totalRevenue: totalRevenue._sum.final_amount || 0
      };
    }, userId);
  }
}

module.exports = {
  researchPaperConfigRepository: new ResearchPaperConfigRepository(),
  researchPaperPurchaseRepository: new ResearchPaperPurchaseRepository()
};
