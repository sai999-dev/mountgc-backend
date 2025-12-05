const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// GET /api/user - Get all users (admin only)
router.get('/', authenticateToken, userController.getAllUsers);

// PUT /api/user/profile - Update current user's profile
router.put('/profile', authenticateToken, userController.updateProfile);

// GET /api/user/:id - Get single user
router.get('/:id', authenticateToken, userController.getUserById);

// PUT /api/user/:id - Update user (admin only)
router.put('/:id', authenticateToken, userController.updateUser);

// DELETE /api/user/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
