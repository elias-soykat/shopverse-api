require("dotenv").config();
const { sequelize } = require("../models");
const seedData = require("../seeders/sample-data");

async function runSeeder() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync database
    await sequelize.sync({ force: true });
    console.log("✅ Database synchronized.");

    // Run seeder
    await seedData();

    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeder();
