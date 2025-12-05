const prisma = require('../config/prisma');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        user_role: true,
        is_active: true,
        created_at: true
      }
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(id) },
      select: {
        user_id: true,
        username: true,
        email: true,
        user_role: true,
        is_active: true,
        created_at: true,
        last_login_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update current user's profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        user_id: { not: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { username: username.trim() },
      select: {
        user_id: true,
        username: true,
        email: true,
        user_role: true,
        is_active: true,
        email_verify: true,
        created_at: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, user_role, is_active } = req.body;

    // Build update data
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (user_role !== undefined) updateData.user_role = user_role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const user = await prisma.user.update({
      where: { user_id: parseInt(id) },
      data: updateData,
      select: {
        user_id: true,
        username: true,
        email: true,
        user_role: true,
        is_active: true,
        created_at: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user (ADD THIS FUNCTION)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user?.userId;

    // Don't allow deleting yourself
    if (parseInt(id) === adminUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await prisma.user.delete({
      where: { user_id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser
};
