const prisma = require('../../config/prisma');

/**
 * Repository for Visa Application Config operations
 */
const visaApplicationConfigRepository = {
  /**
   * Find all configurations
   */
  async findAll() {
    return prisma.visaApplicationConfig.findMany({
      where: { is_active: true },
      orderBy: [
        { currency: 'asc' },
        { dependents: 'asc' },
        { mocks: 'asc' },
      ],
    });
  },

  /**
   * Find configurations by currency
   */
  async findByCurrency(currency) {
    return prisma.visaApplicationConfig.findMany({
      where: {
        currency: currency.toUpperCase(),
        is_active: true,
      },
      orderBy: [
        { dependents: 'asc' },
        { mocks: 'asc' },
      ],
    });
  },

  /**
   * Find specific configuration
   */
  async findByParams(currency, dependents, mocks) {
    return prisma.visaApplicationConfig.findFirst({
      where: {
        currency: currency.toUpperCase(),
        dependents: parseInt(dependents),
        mocks: parseInt(mocks),
        is_active: true,
      },
    });
  },

  /**
   * Create or update configuration (Upsert)
   */
  async upsertConfig(data) {
    return prisma.visaApplicationConfig.upsert({
      where: {
        currency_dependents_mocks: {
          currency: data.currency,
          dependents: data.dependents,
          mocks: data.mocks,
        },
      },
      update: {
        actual_price: data.actual_price,
        discounted_price: data.discounted_price,
        discount_percent: data.discount_percent,
        duration_months: data.duration_months,
        is_active: data.is_active,
      },
      create: data,
    });
  },

  /**
   * Update configuration
   */
  async updateConfig(configId, data) {
    return prisma.visaApplicationConfig.update({
      where: { config_id: parseInt(configId) },
      data,
    });
  },

  /**
   * Soft delete configuration
   */
  async softDelete(configId) {
    return prisma.visaApplicationConfig.update({
      where: { config_id: parseInt(configId) },
      data: { is_active: false },
    });
  },
};

/**
 * Repository for Visa Application Purchase operations
 */
const visaApplicationPurchaseRepository = {
  /**
   * Create a new purchase
   */
  async create(data) {
    return prisma.visaApplicationPurchase.create({
      data,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Find all purchases with user details
   */
  async findAllWithUsers() {
    return prisma.visaApplicationPurchase.findMany({
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Find purchase by ID with user details
   */
  async findByIdWithUser(purchaseId) {
    return prisma.visaApplicationPurchase.findUnique({
      where: { purchase_id: parseInt(purchaseId) },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Find purchases by user ID
   */
  async findByUserId(userId) {
    return prisma.visaApplicationPurchase.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' },
    });
  },

  /**
   * Find purchase by order ID
   */
  async findByOrderId(orderId) {
    return prisma.visaApplicationPurchase.findUnique({
      where: { order_id: orderId },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Update purchase
   */
  async update(purchaseId, data) {
    return prisma.visaApplicationPurchase.update({
      where: { purchase_id: parseInt(purchaseId) },
      data,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Get purchase statistics
   */
  async getStats() {
    const [total, initiated, inProgress, completed, cancelled] = await Promise.all([
      prisma.visaApplicationPurchase.count(),
      prisma.visaApplicationPurchase.count({
        where: { status: 'initiated' },
      }),
      prisma.visaApplicationPurchase.count({
        where: { status: 'in_progress' },
      }),
      prisma.visaApplicationPurchase.count({
        where: { status: 'completed' },
      }),
      prisma.visaApplicationPurchase.count({
        where: { status: 'cancelled' },
      }),
    ]);

    const totalRevenue = await prisma.visaApplicationPurchase.aggregate({
      _sum: {
        amount_paid: true,
      },
    });

    return {
      total,
      initiated,
      in_progress: inProgress,
      completed,
      cancelled,
      total_revenue: totalRevenue._sum.amount_paid || 0,
    };
  },

  /**
   * Get statistics by country
   */
  async getStatsByCountry() {
    return prisma.visaApplicationPurchase.groupBy({
      by: ['country'],
      _count: {
        purchase_id: true,
      },
      _sum: {
        amount_paid: true,
      },
      orderBy: {
        _count: {
          purchase_id: 'desc',
        },
      },
    });
  },

  /**
   * Get statistics by status
   */
  async getStatsByStatus() {
    return prisma.visaApplicationPurchase.groupBy({
      by: ['status'],
      _count: {
        purchase_id: true,
      },
      orderBy: {
        status: 'asc',
      },
    });
  },
};

module.exports = {
  visaApplicationConfigRepository,
  visaApplicationPurchaseRepository,
};
