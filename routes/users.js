const express = require("express");
const { body, param } = require("express-validator");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { User } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number"),
  body("address")
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage("Address must be between 10 and 500 characters"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be either customer or admin"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const userIdValidation = [
  param("id").isInt().withMessage("User ID must be a valid integer"),
];

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const isActive = req.query.isActive;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    paginatedResponse(
      res,
      users,
      page,
      limit,
      count,
      "Users retrieved successfully"
    );
  } catch (error) {
    console.error("Get users error:", error);
    errorResponse(res, "Failed to get users", error.message, 500);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  userIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Users can only view their own profile unless they're admin
      if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
        return errorResponse(
          res,
          "Access denied",
          "You can only view your own profile",
          403
        );
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return errorResponse(res, "User not found", "User does not exist", 404);
      }

      successResponse(res, { user }, "User retrieved successfully");
    } catch (error) {
      console.error("Get user error:", error);
      errorResponse(res, "Failed to get user", error.message, 500);
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put(
  "/:id",
  authenticateToken,
  userIdValidation,
  updateUserValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Users can only update their own profile unless they're admin
      if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
        return errorResponse(
          res,
          "Access denied",
          "You can only update your own profile",
          403
        );
      }

      // Non-admin users cannot change role or isActive
      if (req.user.role !== "admin") {
        delete updateData.role;
        delete updateData.isActive;
      }

      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, "User not found", "User does not exist", 404);
      }

      await user.update(updateData);

      successResponse(
        res,
        { user: user.toJSON() },
        "User updated successfully"
      );
    } catch (error) {
      console.error("Update user error:", error);
      errorResponse(res, "Failed to update user", error.message, 500);
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  userIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (req.user.id === parseInt(id)) {
        return errorResponse(
          res,
          "Cannot delete self",
          "You cannot delete your own account",
          400
        );
      }

      const user = await User.findByPk(id);
      if (!user) {
        return errorResponse(res, "User not found", "User does not exist", 404);
      }

      await user.destroy();

      successResponse(res, null, "User deleted successfully");
    } catch (error) {
      console.error("Delete user error:", error);
      errorResponse(res, "Failed to delete user", error.message, 500);
    }
  }
);

module.exports = router;
