require("dotenv").config();
const { Sequelize } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup...");

    // Create a connection without specifying database to create it
    const tempSequelize = new Sequelize(
      "postgres", // Connect to default postgres database
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false,
      }
    );

    // Test connection
    await tempSequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Create database if it doesn't exist
    try {
      await tempSequelize.query(`CREATE DATABASE "${dbConfig.database}";`);
      console.log(`✅ Database "${dbConfig.database}" created successfully.`);
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log(`ℹ️  Database "${dbConfig.database}" already exists.`);
      } else {
        throw error;
      }
    }

    await tempSequelize.close();

    // Now connect to the actual database and sync
    const { sequelize } = require("../models");

    // Test connection to the actual database
    await sequelize.authenticate();
    console.log("✅ Connected to target database successfully.");

    // Sync database (this will create all tables)
    console.log("🔄 Syncing database schema...");
    await sequelize.sync({ force: true });
    console.log("✅ Database schema synchronized.");

    // Run seeder
    console.log("🌱 Running seeders...");
    const seedData = require("../seeders/sample-data");
    await seedData();

    console.log("\n🎉 Database setup completed successfully!");
    console.log("📊 Database:", dbConfig.database);
    console.log("👤 Admin email: admin@shopverse.com");
    console.log("🔑 Admin password: admin123");
    console.log("👤 Customer email: customer@shopverse.com");
    console.log("🔑 Customer password: customer123");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
