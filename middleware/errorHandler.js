const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error.message = message;
    error.statusCode = 400;
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error.message = message;
    error.statusCode = 400;
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    error.message = "Referenced record does not exist";
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = 401;
  }

  // Cast error (invalid ID)
  if (err.name === "CastError") {
    error.message = "Invalid ID format";
    error.statusCode = 400;
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
