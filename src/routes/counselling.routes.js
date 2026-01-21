const express = require("express");
const router = express.Router();

// Controllers
const adminController = require("../controllers/admin/counselling.controller");
const studentController = require("../controllers/student/counselling.controller");

// Middleware
const { authenticateToken, authorizeRole } = require("../middleware/auth.middleware");

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
router.get("/admin/service-types", authenticateToken, authorizeRole("admin"), adminController.getServiceTypes);
router.post("/admin/service-types", authenticateToken, authorizeRole("admin"), adminController.createServiceType);
router.put("/admin/service-types/:id", authenticateToken, authorizeRole("admin"), adminController.updateServiceType);
router.delete("/admin/service-types/:id", authenticateToken, authorizeRole("admin"), adminController.deleteServiceType);

// Counselors
router.get("/admin/counselors", authenticateToken, authorizeRole("admin"), adminController.getCounselors);
router.post("/admin/counselors", authenticateToken, authorizeRole("admin"), adminController.createCounselor);
router.put("/admin/counselors/:id", authenticateToken, authorizeRole("admin"), adminController.updateCounselor);
router.delete("/admin/counselors/:id", authenticateToken, authorizeRole("admin"), adminController.deleteCounselor);

// Pricing Configs
router.get("/admin/pricing", authenticateToken, authorizeRole("admin"), adminController.getPricingConfigs);
router.post("/admin/pricing", authenticateToken, authorizeRole("admin"), adminController.createPricingConfig);
router.put("/admin/pricing/:id", authenticateToken, authorizeRole("admin"), adminController.updatePricingConfig);
router.delete("/admin/pricing/:id", authenticateToken, authorizeRole("admin"), adminController.deletePricingConfig);

// Purchases Management
router.get("/admin/purchases", authenticateToken, authorizeRole("admin"), adminController.getPurchases);
router.get("/admin/purchases/:id", authenticateToken, authorizeRole("admin"), adminController.getPurchaseById);
router.put("/admin/purchases/:id", authenticateToken, authorizeRole("admin"), adminController.updatePurchase);

// Dashboard Stats
router.get("/admin/dashboard-stats", authenticateToken, authorizeRole("admin"), adminController.getDashboardStats);

module.exports = router;
