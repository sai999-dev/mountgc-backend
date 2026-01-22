const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/admin/counselling.controller");
const studentController = require("../controllers/student/counselling.controller");

// Middleware
const { authenticateToken } = require("../middleware/auth.middleware");
const { authenticateAdmin } = require("../middleware/admin-auth.middleware");

// ==================== PUBLIC ROUTES ====================

// Get pricing data (no auth required)
router.get("/pricing", studentController.getPricing);

// ==================== STUDENT ROUTES (Auth Required) ====================

// Create purchase
router.post("/purchase", authenticateToken, studentController.createPurchase);

// Get my purchases
router.get("/my-purchases", authenticateToken, studentController.getMyPurchases);

// Get single purchase
router.get("/my-purchases/:id", authenticateToken, studentController.getPurchaseById);

// ==================== ADMIN ROUTES ====================

// Service Types
router.get("/admin/service-types", authenticateAdmin, adminController.getServiceTypes);
router.post("/admin/service-types", authenticateAdmin, adminController.createServiceType);
router.put("/admin/service-types/:id", authenticateAdmin, adminController.updateServiceType);
router.delete("/admin/service-types/:id", authenticateAdmin, adminController.deleteServiceType);

// Counselors
router.get("/admin/counselors", authenticateAdmin, adminController.getCounselors);
router.post("/admin/counselors", authenticateAdmin, adminController.createCounselor);
router.put("/admin/counselors/:id", authenticateAdmin, adminController.updateCounselor);
router.delete("/admin/counselors/:id", authenticateAdmin, adminController.deleteCounselor);

// Pricing Configs
router.get("/admin/pricing", authenticateAdmin, adminController.getPricingConfigs);
router.post("/admin/pricing", authenticateAdmin, adminController.createPricingConfig);
router.put("/admin/pricing/:id", authenticateAdmin, adminController.updatePricingConfig);
router.delete("/admin/pricing/:id", authenticateAdmin, adminController.deletePricingConfig);

// Purchases Management
router.get("/admin/purchases", authenticateAdmin, adminController.getPurchases);
router.get("/admin/purchases/:id", authenticateAdmin, adminController.getPurchaseById);
router.put("/admin/purchases/:id", authenticateAdmin, adminController.updatePurchase);

// Dashboard Stats
router.get("/admin/dashboard-stats", authenticateAdmin, adminController.getDashboardStats);

module.exports = router;
