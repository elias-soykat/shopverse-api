const express = require("express");
const { body, param } = require("express-validator");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { Category, Product } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("imageUrl")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const updateCategoryValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("imageUrl")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const categoryIdValidation = [
  param("id").isInt().withMessage("Category ID must be a valid integer"),
];

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const isActive = req.query.isActive;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const { count, rows: categories } = await Category.findAndCountAll({
      where: whereClause,
      order: [["name", "ASC"]],
      limit,
      offset,
    });

    paginatedResponse(
      res,
      categories,
      page,
      limit,
      count,
      "Categories retrieved successfully"
    );
  } catch (error) {
    console.error("Get categories error:", error);
    errorResponse(res, "Failed to get categories", error.message, 500);
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID with products
// @access  Public
router.get("/:id", categoryIdValidation, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const offset = (page - 1) * limit;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Product,
          as: "products",
          where: { isActive: true },
          required: false,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        },
      ],
    });

    if (!category) {
      return errorResponse(
        res,
        "Category not found",
        "Category does not exist",
        404
      );
    }

    // Get total product count for pagination
    const productCount = await Product.count({
      where: { categoryId: id, isActive: true },
    });

    const response = {
      category: {
        ...category.toJSON(),
        products: category.products,
        productCount,
      },
    };

    successResponse(res, response, "Category retrieved successfully");
  } catch (error) {
    console.error("Get category error:", error);
    errorResponse(res, "Failed to get category", error.message, 500);
  }
});

// @route   POST /api/categories
// @desc    Create new category (admin only)
// @access  Private/Admin
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  createCategoryValidation,
  validate,
  async (req, res) => {
    try {
      const categoryData = req.body;

      // Check if category with same name already exists
      const existingCategory = await Category.findOne({
        where: { name: categoryData.name },
      });

      if (existingCategory) {
        return errorResponse(
          res,
          "Category already exists",
          "A category with this name already exists",
          400
        );
      }

      const category = await Category.create(categoryData);

      successResponse(res, { category }, "Category created successfully", 201);
    } catch (error) {
      console.error("Create category error:", error);
      errorResponse(res, "Failed to create category", error.message, 500);
    }
  }
);

// @route   PUT /api/categories/:id
// @desc    Update category (admin only)
// @access  Private/Admin
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  categoryIdValidation,
  updateCategoryValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return errorResponse(
          res,
          "Category not found",
          "Category does not exist",
          404
        );
      }

      // Check if category with same name already exists (excluding current category)
      if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await Category.findOne({
          where: { name: updateData.name },
        });

        if (existingCategory) {
          return errorResponse(
            res,
            "Category already exists",
            "A category with this name already exists",
            400
          );
        }
      }

      await category.update(updateData);

      successResponse(res, { category }, "Category updated successfully");
    } catch (error) {
      console.error("Update category error:", error);
      errorResponse(res, "Failed to update category", error.message, 500);
    }
  }
);

// @route   DELETE /api/categories/:id
// @desc    Delete category (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  categoryIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);
      if (!category) {
        return errorResponse(
          res,
          "Category not found",
          "Category does not exist",
          404
        );
      }

      // Check if category has products
      const productCount = await Product.count({
        where: { categoryId: id },
      });

      if (productCount > 0) {
        return errorResponse(
          res,
          "Cannot delete category",
          `Category has ${productCount} products. Please reassign or delete products first.`,
          400
        );
      }

      await category.destroy();

      successResponse(res, null, "Category deleted successfully");
    } catch (error) {
      console.error("Delete category error:", error);
      errorResponse(res, "Failed to delete category", error.message, 500);
    }
  }
);

module.exports = router;
