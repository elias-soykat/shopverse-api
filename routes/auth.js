const express = require("express");
const { body } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");
const validate = require("../middleware/validation");
const { successResponse, errorResponse } = require("../utils/response");
const { generateToken } = require("../utils/jwt");
const { User } = require("../models");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number"),
  body("address")
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage("Address must be between 10 and 500 characters"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerValidation, validate, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(
        res,
        "User already exists",
        "Email is already registered",
        400
      );
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login
    await user.update({ lastLogin: new Date() });

    successResponse(
      res,
      {
        user: user.toJSON(),
        token,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    errorResponse(res, "Registration failed", error.message, 500);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(
        res,
        "Invalid credentials",
        "Email or password is incorrect",
        401
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(
        res,
        "Account disabled",
        "Your account has been disabled",
        401
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(
        res,
        "Invalid credentials",
        "Email or password is incorrect",
        401
      );
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login
    await user.update({ lastLogin: new Date() });

    successResponse(
      res,
      {
        user: user.toJSON(),
        token,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    errorResponse(res, "Login failed", error.message, 500);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", authenticateToken, async (req, res) => {
  try {
    successResponse(
      res,
      {
        user: req.user.toJSON(),
      },
      "Profile retrieved successfully"
    );
  } catch (error) {
    console.error("Get profile error:", error);
    errorResponse(res, "Failed to get profile", error.message, 500);
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a more advanced setup, you might want to blacklist the token
    // For now, we'll just return a success response
    successResponse(res, null, "Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    errorResponse(res, "Logout failed", error.message, 500);
  }
});

module.exports = router;
