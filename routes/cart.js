const express = require("express");
const { body, param } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const validate = require("../middleware/validation");
const { successResponse, errorResponse } = require("../utils/response");
const { Cart, CartItem, Product } = require("../models");
const { sequelize } = require("../models");

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body("productId").isInt().withMessage("Product ID must be a valid integer"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
];

const updateCartItemValidation = [
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
];

const cartItemIdValidation = [
  param("id").isInt().withMessage("Cart item ID must be a valid integer"),
];

// Helper function to get or create user's active cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({
    where: { userId, isActive: true },
  });

  if (!cart) {
    cart = await Cart.create({
      userId,
      isActive: true,
    });
  }

  return cart;
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id, isActive: true },
      include: [
        {
          model: CartItem,
          as: "cartItems",
          include: [
            {
              model: Product,
              as: "product",
              attributes: [
                "id",
                "name",
                "price",
                "images",
                "stock",
                "isActive",
              ],
            },
          ],
          order: [["addedAt", "DESC"]],
        },
      ],
    });

    if (!cart) {
      return successResponse(
        res,
        {
          cart: null,
          cartItems: [],
          totalItems: 0,
          totalAmount: 0,
        },
        "Cart is empty"
      );
    }

    // Calculate totals and filter out inactive products
    let totalItems = 0;
    let totalAmount = 0;
    const validCartItems = [];

    for (const item of cart.cartItems) {
      if (item.product && item.product.isActive) {
        totalItems += item.quantity;
        totalAmount += item.quantity * parseFloat(item.product.price);
        validCartItems.push(item);
      }
    }

    // Remove invalid items from cart
    const invalidItems = cart.cartItems.filter(
      (item) => !item.product || !item.product.isActive
    );
    for (const item of invalidItems) {
      await item.destroy();
    }

    successResponse(
      res,
      {
        cart: {
          id: cart.id,
          isActive: cart.isActive,
          expiresAt: cart.expiresAt,
        },
        cartItems: validCartItems,
        totalItems,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
      },
      "Cart retrieved successfully"
    );
  } catch (error) {
    console.error("Get cart error:", error);
    errorResponse(res, "Failed to get cart", error.message, 500);
  }
});

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post(
  "/items",
  authenticateToken,
  addToCartValidation,
  validate,
  async (req, res) => {
    try {
      const { productId, quantity } = req.body;

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

      // Check stock availability
      if (product.stock < quantity) {
        return errorResponse(
          res,
          "Insufficient stock",
          `Only ${product.stock} items available in stock`,
          400
        );
      }

      // Get or create cart
      const cart = await getOrCreateCart(req.user.id);

      // Check if item already exists in cart
      const existingItem = await CartItem.findOne({
        where: { cartId: cart.id, productId },
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        if (product.stock < newQuantity) {
          return errorResponse(
            res,
            "Insufficient stock",
            `Cannot add ${quantity} more items. Only ${
              product.stock - existingItem.quantity
            } additional items available.`,
            400
          );
        }

        await existingItem.update({ quantity: newQuantity });

        const updatedItem = await CartItem.findByPk(existingItem.id, {
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price", "images", "stock"],
            },
          ],
        });

        return successResponse(
          res,
          { cartItem: updatedItem },
          "Cart item updated successfully"
        );
      }

      // Add new item to cart
      const cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
      });

      const newCartItem = await CartItem.findByPk(cartItem.id, {
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "images", "stock"],
          },
        ],
      });

      successResponse(
        res,
        { cartItem: newCartItem },
        "Item added to cart successfully",
        201
      );
    } catch (error) {
      console.error("Add to cart error:", error);
      errorResponse(res, "Failed to add item to cart", error.message, 500);
    }
  }
);

// @route   PUT /api/cart/items/:id
// @desc    Update cart item quantity
// @access  Private
router.put(
  "/items/:id",
  authenticateToken,
  cartItemIdValidation,
  updateCartItemValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      // Find cart item and verify ownership
      const cartItem = await CartItem.findOne({
        where: { id },
        include: [
          {
            model: Cart,
            as: "cart",
            where: { userId: req.user.id, isActive: true },
          },
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "images", "stock", "isActive"],
          },
        ],
      });

      if (!cartItem) {
        return errorResponse(
          res,
          "Cart item not found",
          "Cart item does not exist",
          404
        );
      }

      if (!cartItem.product || !cartItem.product.isActive) {
        await cartItem.destroy();
        return errorResponse(
          res,
          "Product unavailable",
          "Product is no longer available",
          400
        );
      }

      // Check stock availability
      if (cartItem.product.stock < quantity) {
        return errorResponse(
          res,
          "Insufficient stock",
          `Only ${cartItem.product.stock} items available in stock`,
          400
        );
      }

      await cartItem.update({ quantity });

      const updatedCartItem = await CartItem.findByPk(id, {
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "images", "stock"],
          },
        ],
      });

      successResponse(
        res,
        { cartItem: updatedCartItem },
        "Cart item updated successfully"
      );
    } catch (error) {
      console.error("Update cart item error:", error);
      errorResponse(res, "Failed to update cart item", error.message, 500);
    }
  }
);

// @route   DELETE /api/cart/items/:id
// @desc    Remove item from cart
// @access  Private
router.delete(
  "/items/:id",
  authenticateToken,
  cartItemIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find cart item and verify ownership
      const cartItem = await CartItem.findOne({
        where: { id },
        include: [
          {
            model: Cart,
            as: "cart",
            where: { userId: req.user.id, isActive: true },
          },
        ],
      });

      if (!cartItem) {
        return errorResponse(
          res,
          "Cart item not found",
          "Cart item does not exist",
          404
        );
      }

      await cartItem.destroy();

      successResponse(res, null, "Item removed from cart successfully");
    } catch (error) {
      console.error("Remove cart item error:", error);
      errorResponse(res, "Failed to remove item from cart", error.message, 500);
    }
  }
);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id, isActive: true },
    });

    if (!cart) {
      return successResponse(res, null, "Cart is already empty");
    }

    // Delete all cart items
    await CartItem.destroy({
      where: { cartId: cart.id },
    });

    // Deactivate cart
    await cart.update({ isActive: false });

    successResponse(res, null, "Cart cleared successfully");
  } catch (error) {
    console.error("Clear cart error:", error);
    errorResponse(res, "Failed to clear cart", error.message, 500);
  }
});

module.exports = router;
