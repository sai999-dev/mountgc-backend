const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/admin/counselling.controller");
const studentController = require("../controllers/student/counselling.controller");

// Middleware
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// ==================== PUBLIC ROUTES ====================

// Get pricing data (no auth required)
router.get("/pricing", studentController.getPricing);

// ==================== STUDENT ROUTES (Auth Required) ====================

// Create purchase
router.post("/purchase", verifyToken, studentController.createPurchase);

// Get my purchases
router.get("/my-purchases", verifyToken, studentController.getMyPurchases);

// Get single purchase
router.get("/my-purchases/:id", verifyToken, studentController.getPurchaseById);

// ==================== ADMIN ROUTES ====================

// Service Types
router.get("/admin/service-types", verifyToken, isAdmin, adminController.getServiceTypes);
router.post("/admin/service-types", verifyToken, isAdmin, adminController.createServiceType);
router.put("/admin/service-types/:id", verifyToken, isAdmin, adminController.updateServiceType);
router.delete("/admin/service-types/:id", verifyToken, isAdmin, adminController.deleteServiceType);

// Counselors
router.get("/admin/counselors", verifyToken, isAdmin, adminController.getCounselors);
router.post("/admin/counselors", verifyToken, isAdmin, adminController.createCounselor);
router.put("/admin/counselors/:id", verifyToken, isAdmin, adminController.updateCounselor);
router.delete("/admin/counselors/:id", verifyToken, isAdmin, adminController.deleteCounselor);

// Pricing Configs
router.get("/admin/pricing", verifyToken, isAdmin, adminController.getPricingConfigs);
router.post("/admin/pricing", verifyToken, isAdmin, adminController.createPricingConfig);
router.put("/admin/pricing/:id", verifyToken, isAdmin, adminController.updatePricingConfig);
router.delete("/admin/pricing/:id", verifyToken, isAdmin, adminController.deletePricingConfig);

// Purchases Management
router.get("/admin/purchases", verifyToken, isAdmin, adminController.getPurchases);
router.get("/admin/purchases/:id", verifyToken, isAdmin, adminController.getPurchaseById);
router.put("/admin/purchases/:id", verifyToken, isAdmin, adminController.updatePurchase);

// Dashboard Stats
router.get("/admin/dashboard-stats", verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router;
