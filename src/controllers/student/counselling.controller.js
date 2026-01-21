const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get pricing data for frontend (public)
const getPricing = async (req, res) => {
  try {
    // Get all active service types with their pricing
    const serviceTypes = await prisma.counsellingServiceType.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      select: {
        service_type_id: true,
        name: true,
        description: true,
        duration: true,
      },
    });

    // Get all active counselors
    const counselors = await prisma.counselor.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      select: {
        counselor_id: true,
        name: true,
        role: true,
      },
    });

    // Get all active pricing configs grouped by service type and currency
    const pricingConfigs = await prisma.counsellingPricingConfig.findMany({
      where: { is_active: true },
      include: {
        service_type: {
          select: {
            service_type_id: true,
            name: true,
            duration: true,
          },
        },
        counselor: {
          select: {
            counselor_id: true,
            name: true,
          },
        },
      },
    });

    // Structure pricing data by service_type -> currency
    const pricingByService = {};
    pricingConfigs.forEach((config) => {
      const serviceId = config.service_type_id;
      if (!pricingByService[serviceId]) {
        pricingByService[serviceId] = {
          service_type: config.service_type,
          pricing: {},
        };
      }

      const key = config.counselor_id
        ? `${config.currency}_${config.counselor_id}`
        : config.currency;

      pricingByService[serviceId].pricing[key] = {
        config_id: config.config_id,
        currency: config.currency,
        counselor_id: config.counselor_id,
        counselor: config.counselor,
        actual_price: config.actual_price,
        discounted_price: config.discounted_price,
        discount_percent: config.discount_percent,
      };
    });

    res.json({
      success: true,
      data: {
        serviceTypes,
        counselors,
        pricing: pricingByService,
        pricingConfigs, // Raw configs for flexibility
      },
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing information",
      error: error.message,
    });
  }
};

// Create a purchase (requires authentication)
const createPurchase = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      service_type_id,
      counselor_id,
      name,
      email,
      phone,
      currency,
      actual_amount,
      discount_amount,
      final_amount,
      duration,
      notes,
    } = req.body;

    // Validate required fields
    if (!service_type_id || !name || !email || !phone || !currency || !final_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify service type exists
    const serviceType = await prisma.counsellingServiceType.findUnique({
      where: { service_type_id: parseInt(service_type_id) },
    });

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type",
      });
    }

    // Create the purchase
    const purchase = await prisma.counsellingPurchase.create({
      data: {
        user_id: userId,
        service_type_id: parseInt(service_type_id),
        counselor_id: counselor_id ? parseInt(counselor_id) : null,
        name,
        email,
        phone,
        currency,
        actual_amount: parseFloat(actual_amount),
        discount_amount: parseFloat(discount_amount),
        final_amount: parseFloat(final_amount),
        duration: duration || serviceType.duration,
        notes,
        status: "initiated",
        payment_status: "pending",
        case_status: "open",
      },
      include: {
        service_type: true,
        counselor: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: {
        purchase_id: purchase.purchase_id,
        order_id: purchase.order_id,
        service_type: purchase.service_type.name,
        counselor: purchase.counselor?.name,
        final_amount: purchase.final_amount,
        currency: purchase.currency,
      },
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  }
};

// Get user's purchases
const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const purchases = await prisma.counsellingPurchase.findMany({
      where: { user_id: userId },
      include: {
        service_type: true,
        counselor: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: purchases,
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

// Get single purchase details
const getPurchaseById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const purchase = await prisma.counsellingPurchase.findFirst({
      where: {
        purchase_id: parseInt(id),
        user_id: userId,
      },
      include: {
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

    res.json({
      success: true,
      data: purchase,
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

module.exports = {
  getPricing,
  createPurchase,
  getMyPurchases,
  getPurchaseById,
};
