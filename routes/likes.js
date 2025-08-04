const express = require("express");
const { param } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { Like, Product, User } = require("../models");

const router = express.Router();

// Validation rules
const productIdValidation = [
  param("productId").isInt().withMessage("Product ID must be a valid integer"),
];

// @route   GET /api/likes
// @desc    Get user's liked products
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const offset = (page - 1) * limit;

    const { count, rows: likes } = await Like.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: "product",
          where: { isActive: true },
          required: true,
          include: [
            {
              model: require("../models").Category,
              as: "category",
              attributes: ["id", "name", "slug"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Transform the response to include product details
    const likedProducts = likes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      product: like.product,
    }));

    paginatedResponse(
      res,
      likedProducts,
      page,
      limit,
      count,
      "Liked products retrieved successfully"
    );
  } catch (error) {
    console.error("Get likes error:", error);
    errorResponse(res, "Failed to get liked products", error.message, 500);
  }
});

// @route   POST /api/likes/:productId
// @desc    Like a product
// @access  Private
router.post(
  "/:productId",
  authenticateToken,
  productIdValidation,
  validate,
  async (req, res) => {
    try {
      const { productId } = req.params;

      // Check if product exists and is active
      const product = await Product.findOne({
        where: { id: productId, isActive: true },
      });

      if (!product) {
        return errorResponse(
          res,
          "Product not found",
          "Product does not exist or is inactive",
          404
        );
      }

      // Check if user already liked this product
      const existingLike = await Like.findOne({
        where: { userId: req.user.id, productId },
      });

      if (existingLike) {
        return errorResponse(
          res,
          "Already liked",
          "You have already liked this product",
          400
        );
      }

      // Create like
      const like = await Like.create({
        userId: req.user.id,
        productId,
      });

      // Fetch the created like with product details
      const createdLike = await Like.findByPk(like.id, {
        include: [
          {
            model: Product,
            as: "product",
            include: [
              {
                model: require("../models").Category,
                as: "category",
                attributes: ["id", "name", "slug"],
              },
            ],
          },
        ],
      });

      successResponse(
        res,
        { like: createdLike },
        "Product liked successfully",
        201
      );
    } catch (error) {
      console.error("Like product error:", error);
      errorResponse(res, "Failed to like product", error.message, 500);
    }
  }
);

// @route   DELETE /api/likes/:productId
// @desc    Unlike a product
// @access  Private
router.delete(
  "/:productId",
  authenticateToken,
  productIdValidation,
  validate,
  async (req, res) => {
    try {
      const { productId } = req.params;

      // Find and delete the like
      const like = await Like.findOne({
        where: { userId: req.user.id, productId },
      });

      if (!like) {
        return errorResponse(
          res,
          "Like not found",
          "You have not liked this product",
          404
        );
      }

      await like.destroy();

      successResponse(res, null, "Product unliked successfully");
    } catch (error) {
      console.error("Unlike product error:", error);
      errorResponse(res, "Failed to unlike product", error.message, 500);
    }
  }
);

// @route   GET /api/likes/check/:productId
// @desc    Check if user has liked a product
// @access  Private
router.get(
  "/check/:productId",
  authenticateToken,
  productIdValidation,
  validate,
  async (req, res) => {
    try {
      const { productId } = req.params;

      const like = await Like.findOne({
        where: { userId: req.user.id, productId },
      });

      successResponse(
        res,
        { isLiked: !!like },
        "Like status checked successfully"
      );
    } catch (error) {
      console.error("Check like error:", error);
      errorResponse(res, "Failed to check like status", error.message, 500);
    }
  }
);

module.exports = router;
