const express = require("express");
const { body, param } = require("express-validator");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validation");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../utils/response");
const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  User,
} = require("../models");
const { sequelize } = require("sequelize");
const { Op } = require("sequelize");

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body("shippingAddress")
    .isObject()
    .withMessage("Shipping address must be an object"),
  body("shippingAddress.street")
    .notEmpty()
    .withMessage("Street address is required"),
  body("shippingAddress.city").notEmpty().withMessage("City is required"),
  body("shippingAddress.state").notEmpty().withMessage("State is required"),
  body("shippingAddress.zipCode")
    .notEmpty()
    .withMessage("Zip code is required"),
  body("shippingAddress.country").notEmpty().withMessage("Country is required"),
  body("billingAddress")
    .isObject()
    .withMessage("Billing address must be an object"),
  body("billingAddress.street")
    .notEmpty()
    .withMessage("Street address is required"),
  body("billingAddress.city").notEmpty().withMessage("City is required"),
  body("billingAddress.state").notEmpty().withMessage("State is required"),
  body("billingAddress.zipCode").notEmpty().withMessage("Zip code is required"),
  body("billingAddress.country").notEmpty().withMessage("Country is required"),
  body("paymentMethod").notEmpty().withMessage("Payment method is required"),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),
];

const updateOrderStatusValidation = [
  body("status")
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .withMessage("Invalid order status"),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes must be less than 500 characters"),
];

const orderIdValidation = [
  param("id").isInt().withMessage("Order ID must be a valid integer"),
];

// @route   GET /api/orders
// @desc    Get user orders or all orders (admin)
// @access  Private
router.get("/", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    // If not admin, only show user's orders
    if (req.user.role !== "admin") {
      whereClause.userId = req.user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "images"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    paginatedResponse(
      res,
      orders,
      page,
      limit,
      count,
      "Orders retrieved successfully"
    );
  } catch (error) {
    console.error("Get orders error:", error);
    errorResponse(res, "Failed to get orders", error.message, 500);
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  orderIdValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const whereClause = { id };

      // If not admin, only allow access to own orders
      if (req.user.role !== "admin") {
        whereClause.userId = req.user.id;
      }

      const order = await Order.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email", "phone"],
          },
          {
            model: OrderItem,
            as: "orderItems",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "images", "sku"],
              },
            ],
          },
        ],
      });

      if (!order) {
        return errorResponse(
          res,
          "Order not found",
          "Order does not exist",
          404
        );
      }

      successResponse(res, { order }, "Order retrieved successfully");
    } catch (error) {
      console.error("Get order error:", error);
      errorResponse(res, "Failed to get order", error.message, 500);
    }
  }
);

// @route   POST /api/orders
// @desc    Create new order (checkout)
// @access  Private
router.post(
  "/",
  authenticateToken,
  createOrderValidation,
  validate,
  async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { shippingAddress, billingAddress, paymentMethod, notes } =
        req.body;

      // Get user's active cart
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
                attributes: ["id", "name", "price", "stock", "isActive"],
              },
            ],
          },
        ],
      });

      if (!cart || cart.cartItems.length === 0) {
        await transaction.rollback();
        return errorResponse(
          res,
          "Empty cart",
          "Cannot checkout with an empty cart",
          400
        );
      }

      // Validate cart items and calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const cartItem of cart.cartItems) {
        if (!cartItem.product || !cartItem.product.isActive) {
          await transaction.rollback();
          return errorResponse(
            res,
            "Product unavailable",
            `${cartItem.product?.name || "Product"} is no longer available`,
            400
          );
        }

        if (cartItem.product.stock < cartItem.quantity) {
          await transaction.rollback();
          return errorResponse(
            res,
            "Insufficient stock",
            `Only ${cartItem.product.stock} items available for ${cartItem.product.name}`,
            400
          );
        }

        const itemTotal =
          cartItem.quantity * parseFloat(cartItem.product.price);
        subtotal += itemTotal;

        orderItems.push({
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.product.price,
          totalPrice: itemTotal,
          productSnapshot: {
            name: cartItem.product.name,
            price: cartItem.product.price,
            images: cartItem.product.images,
          },
        });
      }

      // Calculate totals (simplified - you might want to add tax and shipping calculations)
      const taxAmount = subtotal * 0.1; // 10% tax
      const shippingAmount = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create order
      const order = await Order.create(
        {
          userId: req.user.id,
          status: "pending",
          totalAmount,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount: 0,
          shippingAddress,
          billingAddress,
          paymentMethod,
          paymentStatus: "pending",
          notes,
        },
        { transaction }
      );

      // Create order items
      for (const item of orderItems) {
        await OrderItem.create(
          {
            orderId: order.id,
            ...item,
          },
          { transaction }
        );

        // Update product stock
        await Product.decrement("stock", {
          by: item.quantity,
          where: { id: item.productId },
          transaction,
        });
      }

      // Clear cart
      await CartItem.destroy({
        where: { cartId: cart.id },
        transaction,
      });

      await cart.update({ isActive: false }, { transaction });

      await transaction.commit();

      // Fetch the created order with details
      const createdOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: "orderItems",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "images", "sku"],
              },
            ],
          },
        ],
      });

      successResponse(
        res,
        { order: createdOrder },
        "Order created successfully",
        201
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Create order error:", error);
      errorResponse(res, "Failed to create order", error.message, 500);
    }
  }
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin only)
// @access  Private/Admin
router.put(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  orderIdValidation,
  updateOrderStatusValidation,
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return errorResponse(
          res,
          "Order not found",
          "Order does not exist",
          404
        );
      }

      const updateData = { status };
      if (notes) {
        updateData.notes = notes;
      }

      // Update timestamps for specific status changes
      if (status === "shipped" && order.status !== "shipped") {
        updateData.shippedAt = new Date();
      }

      if (status === "delivered" && order.status !== "delivered") {
        updateData.deliveredAt = new Date();
      }

      await order.update(updateData);

      successResponse(res, { order }, "Order status updated successfully");
    } catch (error) {
      console.error("Update order status error:", error);
      errorResponse(res, "Failed to update order status", error.message, 500);
    }
  }
);

module.exports = router;
