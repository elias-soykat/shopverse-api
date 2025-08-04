const express = require("express");
const { body, param } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const { Comment, Product, User } = require("../models");
const { sequelize } = require("sequelize");

const router = express.Router();

// Validation rules
const createCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
];

const updateCommentValidation = [
  body("content")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
];

const commentIdValidation = [
  param("id").isInt().withMessage("Comment ID must be a valid integer"),
];

const productIdValidation = [
  param("productId").isInt().withMessage("Product ID must be a valid integer"),
];

// @route   GET /api/products/:productId/comments
// @desc    Get product comments
// @access  Public
router.get(
  "/products/:productId",
  productIdValidation,
  validate,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const offset = (page - 1) * limit;

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return errorResponse(
          res,
          "Product not found",
          "Product does not exist",
          404
        );
      }

      const { count, rows: comments } = await Comment.findAndCountAll({
        where: {
          productId,
          isApproved: true,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      paginatedResponse(
        res,
        comments,
        page,
        limit,
        count,
        "Comments retrieved successfully"
      );
    } catch (error) {
      console.error("Get comments error:", error);
      errorResponse(res, "Failed to get comments", error.message, 500);
    }
  }
);

// @route   POST /api/products/:productId/comments
// @desc    Add comment to product
// @access  Private
router.post(
  "/products/:productId",
  authenticateToken,
  productIdValidation,
  createCommentValidation,
  validate,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const { content, rating } = req.body;

      // Check if product exists and is active
      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        return errorResponse(
          res,
          "Product not found",
          "Product does not exist or is inactive",
          404
        );
      }

      // Check if user has already commented on this product
      const existingComment = await Comment.findOne({
        where: { userId: req.user.id, productId },
      });

      if (existingComment) {
        return errorResponse(
          res,
          "Already commented",
          "You have already commented on this product",
          400
        );
      }

      // Create comment
      const comment = await Comment.create({
        userId: req.user.id,
        productId,
        content,
        rating,
      });

      // Update product average rating
      await updateProductRating(productId);

      // Fetch the created comment with user details
      const createdComment = await Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      successResponse(
        res,
        { comment: createdComment },
        "Comment added successfully",
        201
      );
    } catch (error) {
      console.error("Add comment error:", error);
      errorResponse(res, "Failed to add comment", error.message, 500);
    }
  }
);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private
router.put(
  "/:id",
  authenticateToken,
  commentIdValidation,
  updateCommentValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content, rating } = req.body;

      // Find comment and verify ownership
      const comment = await Comment.findOne({
        where: { id, userId: req.user.id },
      });

      if (!comment) {
        return errorResponse(
          res,
          "Comment not found",
          "Comment does not exist or you do not have permission to edit it",
          404
        );
      }

      // Update comment
      const updateData = { content };
      if (rating !== undefined) {
        updateData.rating = rating;
      }

      await comment.update(updateData);

      // Update product average rating if rating changed
      if (rating !== undefined) {
        await updateProductRating(comment.productId);
      }

      // Fetch the updated comment with user details
      const updatedComment = await Comment.findByPk(id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      successResponse(
        res,
        { comment: updatedComment },
        "Comment updated successfully"
      );
    } catch (error) {
      console.error("Update comment error:", error);
      errorResponse(res, "Failed to update comment", error.message, 500);
    }
  }
);

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private
router.delete(
  "/:id",
  authenticateToken,
  commentIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find comment and verify ownership
      const comment = await Comment.findOne({
        where: { id, userId: req.user.id },
      });

      if (!comment) {
        return errorResponse(
          res,
          "Comment not found",
          "Comment does not exist or you do not have permission to delete it",
          404
        );
      }

      const productId = comment.productId;

      // Delete comment
      await comment.destroy();

      // Update product average rating
      await updateProductRating(productId);

      successResponse(res, null, "Comment deleted successfully");
    } catch (error) {
      console.error("Delete comment error:", error);
      errorResponse(res, "Failed to delete comment", error.message, 500);
    }
  }
);

// @route   GET /api/comments/my
// @desc    Get user's comments
// @access  Private
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "images"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    paginatedResponse(
      res,
      comments,
      page,
      limit,
      count,
      "User comments retrieved successfully"
    );
  } catch (error) {
    console.error("Get user comments error:", error);
    errorResponse(res, "Failed to get user comments", error.message, 500);
  }
});

// Helper function to update product average rating
const updateProductRating = async (productId) => {
  try {
    const result = await Comment.findOne({
      where: { productId, isApproved: true },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
      ],
    });

    const averageRating = parseFloat(result?.dataValues?.averageRating || 0);
    const reviewCount = parseInt(result?.dataValues?.reviewCount || 0);

    await Product.update(
      {
        averageRating: parseFloat(averageRating.toFixed(2)),
        reviewCount,
      },
      { where: { id: productId } }
    );
  } catch (error) {
    console.error("Update product rating error:", error);
  }
};

module.exports = router;
