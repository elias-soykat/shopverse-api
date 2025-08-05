require("dotenv").config();

// Helper function to determine logging level
const getLoggingConfig = () => {
  if (process.env.DB_LOGGING === "true") {
    return console.log;
  } else if (process.env.DB_LOGGING === "sql") {
    return (sql) => console.log(sql);
  } else {
    return false;
  }
};

module.exports = {
  development: {
    username: process.env.DB_USER || "my_user",
    password: process.env.DB_PASSWORD || "my_password",
    database: process.env.DB_NAME || "shopverse_db",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: getLoggingConfig(), // Controlled by DB_LOGGING env var
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: process.env.DB_USER || "my_user",
    password: process.env.DB_PASSWORD || "my_password",
    database: process.env.DB_NAME_TEST || "shopverse_test_db",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    username: process.env.DB_USER || "my_user",
    password: process.env.DB_PASSWORD || "my_password",
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
