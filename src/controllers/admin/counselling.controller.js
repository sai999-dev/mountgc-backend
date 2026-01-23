const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==================== SERVICE TYPES ====================

// Get all service types
const getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await prisma.counsellingServiceType.findMany({
      orderBy: { display_order: "asc" },
      include: {
        pricing_configs: {
          where: { is_active: true },
        },
      },
    });

    res.json({
      success: true,
      data: serviceTypes,
    });
  } catch (error) {
    console.error("Error fetching service types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service types",
      error: error.message,
    });
  }
};

// Create service type
const createServiceType = async (req, res) => {
  try {
    const { name, description, duration, is_active, display_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Service type name is required",
      });
    }

    const serviceType = await prisma.counsellingServiceType.create({
      data: {
        name,
        description,
        duration: duration || "1 hour",
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Service type created successfully",
      data: serviceType,
    });
  } catch (error) {
    console.error("Error creating service type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create service type",
      error: error.message,
    });
  }
};

// Update service type
const updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, is_active, display_order } = req.body;

    const serviceType = await prisma.counsellingServiceType.update({
      where: { service_type_id: parseInt(id) },
      data: {
        name,
        description,
        duration,
        is_active,
        display_order,
      },
    });

    res.json({
      success: true,
      message: "Service type updated successfully",
      data: serviceType,
    });
  } catch (error) {
    console.error("Error updating service type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service type",
      error: error.message,
    });
  }
};

// Delete service type
const deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.counsellingServiceType.delete({
      where: { service_type_id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Service type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service type",
      error: error.message,
    });
  }
};

// ==================== COUNSELORS ====================

// Get all counselors
const getCounselors = async (req, res) => {
  try {
    const counselors = await prisma.counselor.findMany({
      orderBy: { display_order: "asc" },
    });

    res.json({
      success: true,
      data: counselors,
    });
  } catch (error) {
    console.error("Error fetching counselors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch counselors",
      error: error.message,
    });
  }
};

// Create counselor
const createCounselor = async (req, res) => {
  try {
    const { name, role, email, is_active, display_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Counselor name is required",
      });
    }

    const counselor = await prisma.counselor.create({
      data: {
        name,
        role,
        email,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Counselor created successfully",
      data: counselor,
    });
  } catch (error) {
    console.error("Error creating counselor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create counselor",
      error: error.message,
    });
  }
};

// Update counselor
const updateCounselor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, email, is_active, display_order } = req.body;

    const counselor = await prisma.counselor.update({
      where: { counselor_id: parseInt(id) },
      data: {
        name,
        role,
        email,
        is_active,
        display_order,
      },
    });

    res.json({
      success: true,
      message: "Counselor updated successfully",
      data: counselor,
    });
  } catch (error) {
    console.error("Error updating counselor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update counselor",
      error: error.message,
    });
  }
};

// Delete counselor
const deleteCounselor = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.counselor.delete({
      where: { counselor_id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Counselor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting counselor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete counselor",
      error: error.message,
    });
  }
};

// ==================== PRICING CONFIGS ====================

// Get all pricing configs
const getPricingConfigs = async (req, res) => {
  try {
    const configs = await prisma.counsellingPricingConfig.findMany({
      include: {
        service_type: true,
        counselor: true,
      },
      orderBy: [{ service_type_id: "asc" }, { currency: "asc" }],
    });

    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("Error fetching pricing configs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing configs",
      error: error.message,
    });
  }
};

// Create pricing config
const createPricingConfig = async (req, res) => {
  try {
    const {
      service_type_id,
      counselor_id,
      currency,
      actual_price,
      discounted_price,
      discount_percent,
      is_active,
    } = req.body;

    if (!service_type_id || !currency || !actual_price || !discounted_price) {
      return res.status(400).json({
        success: false,
        message: "Service type, currency, actual price, and discounted price are required",
      });
    }

    const config = await prisma.counsellingPricingConfig.create({
      data: {
        service_type_id: parseInt(service_type_id),
        counselor_id: counselor_id ? parseInt(counselor_id) : null,
        currency,
        actual_price: parseFloat(actual_price),
        discounted_price: parseFloat(discounted_price),
        discount_percent: discount_percent ? parseFloat(discount_percent) : 20.0,
        is_active: is_active !== undefined ? is_active : true,
      },
      include: {
        service_type: true,
        counselor: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Pricing config created successfully",
      data: config,
    });
  } catch (error) {
    console.error("Error creating pricing config:", error);
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A pricing config with this combination already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create pricing config",
      error: error.message,
    });
  }
};

// Update pricing config
const updatePricingConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      service_type_id,
      counselor_id,
      currency,
      actual_price,
      discounted_price,
      discount_percent,
      is_active,
    } = req.body;

    const config = await prisma.counsellingPricingConfig.update({
      where: { config_id: parseInt(id) },
      data: {
        service_type_id: service_type_id ? parseInt(service_type_id) : undefined,
        counselor_id: counselor_id ? parseInt(counselor_id) : null,
        currency,
        actual_price: actual_price ? parseFloat(actual_price) : undefined,
        discounted_price: discounted_price ? parseFloat(discounted_price) : undefined,
        discount_percent: discount_percent ? parseFloat(discount_percent) : undefined,
        is_active,
      },
      include: {
        service_type: true,
        counselor: true,
      },
    });

    res.json({
      success: true,
      message: "Pricing config updated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Error updating pricing config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pricing config",
      error: error.message,
    });
  }
};

// Delete pricing config
const deletePricingConfig = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.counsellingPricingConfig.delete({
      where: { config_id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Pricing config deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pricing config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pricing config",
      error: error.message,
    });
  }
};

// ==================== PURCHASES ====================

// Get all counselling purchases
const getPurchases = async (req, res) => {
  try {
    const { status, case_status, payment_status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (case_status) where.case_status = case_status;
    if (payment_status) where.payment_status = payment_status;

    const purchases = await prisma.counsellingPurchase.findMany({
      where,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        service_type: true,
        counselor: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Fetch agreements for all purchases
    const userIds = [...new Set(purchases.map(p => p.user_id))];
    const agreements = await prisma.userAgreement.findMany({
      where: {
        user_id: { in: userIds },
        service_type: 'counselling_session',
      },
      select: {
        user_id: true,
        counselling_service_type_id: true,
        signed_name: true,
        agreed_at: true,
        terms_title: true,
        terms_version: true,
      },
    });

    // Map agreements to purchases
    const purchasesWithAgreements = purchases.map(purchase => {
      const agreement = agreements.find(
        a => a.user_id === purchase.user_id &&
             a.counselling_service_type_id === purchase.service_type_id
      );
      return {
        ...purchase,
        has_agreement: !!agreement,
        agreement_signed_at: agreement?.agreed_at || null,
        agreement_signed_name: agreement?.signed_name || null,
      };
    });

    res.json({
      success: true,
      data: purchasesWithAgreements,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

// Get single purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.counsellingPurchase.findUnique({
      where: { purchase_id: parseInt(id) },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        service_type: true,
        counselor: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Get user's agreement for this counselling service type
    const agreement = await prisma.userAgreement.findFirst({
      where: {
        user_id: purchase.user_id,
        service_type: 'counselling_session',
        counselling_service_type_id: purchase.service_type_id,
      },
      include: {
        terms: {
          select: {
            terms_id: true,
            title: true,
            version: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...purchase,
        user_agreement: agreement,
      },
    });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};

// Update purchase (admin notes, status, meeting link, etc.)
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      admin_notes,
      status,
      case_status,
      payment_status,
      scheduled_date,
      scheduled_time,
      meeting_link,
      counselor_id,
    } = req.body;

    const updateData = {};
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (status) updateData.status = status;
    if (case_status) updateData.case_status = case_status;
    if (payment_status) updateData.payment_status = payment_status;
    if (scheduled_date) updateData.scheduled_date = new Date(scheduled_date);
    if (scheduled_time) updateData.scheduled_time = scheduled_time;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (counselor_id !== undefined) {
      updateData.counselor_id = counselor_id ? parseInt(counselor_id) : null;
    }

    const purchase = await prisma.counsellingPurchase.update({
      where: { purchase_id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        service_type: true,
        counselor: true,
      },
    });

    res.json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update purchase",
      error: error.message,
    });
  }
};

// Get dashboard stats for counselling
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalPurchases,
      pendingPurchases,
      completedPurchases,
      openCases,
      totalRevenue,
    ] = await Promise.all([
      prisma.counsellingPurchase.count(),
      prisma.counsellingPurchase.count({
        where: { payment_status: "pending" },
      }),
      prisma.counsellingPurchase.count({
        where: { status: "completed" },
      }),
      prisma.counsellingPurchase.count({
        where: { case_status: "open" },
      }),
      prisma.counsellingPurchase.aggregate({
        where: { payment_status: "completed" },
        _sum: { final_amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalPurchases,
        pendingPurchases,
        completedPurchases,
        openCases,
        totalRevenue: totalRevenue._sum.final_amount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  // Service Types
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  // Counselors
  getCounselors,
  createCounselor,
  updateCounselor,
  deleteCounselor,
  // Pricing Configs
  getPricingConfigs,
  createPricingConfig,
  updatePricingConfig,
  deletePricingConfig,
  // Purchases
  getPurchases,
  getPurchaseById,
  updatePurchase,
  getDashboardStats,
};
