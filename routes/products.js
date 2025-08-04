const express = require("express");
const { body, param, query } = require("express-validator");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { Product, Category, User, Like, Comment } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("categoryId").isInt().withMessage("Category ID must be a valid integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),
  body("dimensions")
    .optional()
    .isObject()
    .withMessage("Dimensions must be an object"),
];

const updateProductValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Product name must be between 2 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("categoryId")
    .optional()
    .isInt()
    .withMessage("Category ID must be a valid integer"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),
  body("dimensions")
    .optional()
    .isObject()
    .withMessage("Dimensions must be an object"),
];

const productIdValidation = [
  param("id").isInt().withMessage("Product ID must be a valid integer"),
];

// @route   GET /api/products
// @desc    Get all products with pagination and filtering
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const categoryId = req.query.categoryId;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const isFeatured = req.query.isFeatured;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "DESC";

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = { isActive: true };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
    }

    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured === "true";
    }

    // Validate sortBy
    const allowedSortFields = ["name", "price", "createdAt", "averageRating"];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const validSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
      ],
      order: [[validSortBy, validSortOrder]],
      limit,
      offset,
    });

    paginatedResponse(
      res,
      products,
      page,
      limit,
      count,
      "Products retrieved successfully"
    );
  } catch (error) {
    console.error("Get products error:", error);
    errorResponse(res, "Failed to get products", error.message, 500);
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get("/:id", productIdValidation, validate, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug", "description"],
        },
        {
          model: Comment,
          as: "comments",
          where: { isApproved: true },
          required: false,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 10,
        },
      ],
    });

    if (!product) {
      return errorResponse(
        res,
        "Product not found",
        "Product does not exist or is inactive",
        404
      );
    }

    successResponse(res, { product }, "Product retrieved successfully");
  } catch (error) {
    console.error("Get product error:", error);
    errorResponse(res, "Failed to get product", error.message, 500);
  }
});

// @route   POST /api/products
// @desc    Create new product (admin only)
// @access  Private/Admin
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  createProductValidation,
  validate,
  async (req, res) => {
    try {
      const productData = req.body;

      // Check if category exists
      const category = await Category.findByPk(productData.categoryId);
      if (!category) {
        return errorResponse(
          res,
          "Category not found",
          "Selected category does not exist",
          404
        );
      }

      const product = await Product.create(productData);

      // Fetch the created product with category
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "slug"],
          },
        ],
      });

      successResponse(
        res,
        { product: createdProduct },
        "Product created successfully",
        201
      );
    } catch (error) {
      console.error("Create product error:", error);
      errorResponse(res, "Failed to create product", error.message, 500);
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update product (admin only)
// @access  Private/Admin
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  productIdValidation,
  updateProductValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return errorResponse(
          res,
          "Product not found",
          "Product does not exist",
          404
        );
      }

      // Check if category exists if categoryId is being updated
      if (updateData.categoryId) {
        const category = await Category.findByPk(updateData.categoryId);
        if (!category) {
          return errorResponse(
            res,
            "Category not found",
            "Selected category does not exist",
            404
          );
        }
      }

      await product.update(updateData);

      // Fetch the updated product with category
      const updatedProduct = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "slug"],
          },
        ],
      });

      successResponse(
        res,
        { product: updatedProduct },
        "Product updated successfully"
      );
    } catch (error) {
      console.error("Update product error:", error);
      errorResponse(res, "Failed to update product", error.message, 500);
    }
  }
);

// @route   DELETE /api/products/:id
// @desc    Delete product (admin only)
// @access  Private/Admin
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  productIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return errorResponse(
          res,
          "Product not found",
          "Product does not exist",
          404
        );
      }

      await product.destroy();

      successResponse(res, null, "Product deleted successfully");
    } catch (error) {
      console.error("Delete product error:", error);
      errorResponse(res, "Failed to delete product", error.message, 500);
    }
  }
);

module.exports = router;
