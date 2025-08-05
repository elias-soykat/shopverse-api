const app = require("./app");
const { sequelize } = require("./models");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync database (in development)
    if (process.env.NODE_ENV === "development") {
      console.log("🔄 Syncing database...");
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized.");
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 ShopVerse API server running on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  sequelize.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  sequelize.close();
  process.exit(0);
});
