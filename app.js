const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const likeRoutes = require("./routes/likes");
const commentRoutes = require("./routes/comments");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "ShopVerse API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Documentation endpoint
app.get("/api-docs", (req, res) => {
  res.json({
    message: "ShopVerse API Documentation",
    version: "1.0.0",
    endpoints: {
      auth: {
        "POST /api/auth/register": "Register a new user",
        "POST /api/auth/login": "Login user",
        "POST /api/auth/logout": "Logout user",
        "GET /api/auth/me": "Get current user profile",
      },
      users: {
        "GET /api/users": "Get all users (admin only)",
        "GET /api/users/:id": "Get user by ID",
        "PUT /api/users/:id": "Update user profile",
        "DELETE /api/users/:id": "Delete user (admin only)",
      },
      products: {
        "GET /api/products": "Get all products with pagination and filtering",
        "GET /api/products/:id": "Get product by ID",
        "POST /api/products": "Create new product (admin only)",
        "PUT /api/products/:id": "Update product (admin only)",
        "DELETE /api/products/:id": "Delete product (admin only)",
      },
      categories: {
        "GET /api/categories": "Get all categories",
        "GET /api/categories/:id": "Get category by ID",
        "POST /api/categories": "Create new category (admin only)",
        "PUT /api/categories/:id": "Update category (admin only)",
        "DELETE /api/categories/:id": "Delete category (admin only)",
      },
      orders: {
        "GET /api/orders": "Get user orders or all orders (admin)",
        "GET /api/orders/:id": "Get order by ID",
        "POST /api/orders": "Create new order (checkout)",
        "PUT /api/orders/:id/status": "Update order status (admin only)",
      },
      cart: {
        "GET /api/cart": "Get user cart",
        "POST /api/cart/items": "Add item to cart",
        "PUT /api/cart/items/:id": "Update cart item quantity",
        "DELETE /api/cart/items/:id": "Remove item from cart",
        "DELETE /api/cart": "Clear cart",
      },
      likes: {
        "GET /api/likes": "Get user liked products",
        "POST /api/likes/:productId": "Like a product",
        "DELETE /api/likes/:productId": "Unlike a product",
      },
      comments: {
        "GET /api/products/:productId/comments": "Get product comments",
        "POST /api/products/:productId/comments": "Add comment to product",
        "PUT /api/comments/:id": "Update comment",
        "DELETE /api/comments/:id": "Delete comment",
      },
    },
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: "/api-docs",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
