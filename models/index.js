const { Sequelize } = require("sequelize");
const config = require("../config/database");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
  }
);

// Import models
const User = require("./User")(sequelize, Sequelize.DataTypes);
const Category = require("./Category")(sequelize, Sequelize.DataTypes);
const Product = require("./Product")(sequelize, Sequelize.DataTypes);
const Order = require("./Order")(sequelize, Sequelize.DataTypes);
const OrderItem = require("./OrderItem")(sequelize, Sequelize.DataTypes);
const Cart = require("./Cart")(sequelize, Sequelize.DataTypes);
const CartItem = require("./CartItem")(sequelize, Sequelize.DataTypes);
const Like = require("./Like")(sequelize, Sequelize.DataTypes);
const Comment = require("./Comment")(sequelize, Sequelize.DataTypes);

// Define associations

// User associations
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
User.hasMany(Cart, { foreignKey: "userId", as: "carts" });
User.hasMany(Like, { foreignKey: "userId", as: "likes" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });

// Category associations
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });

// Product associations
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Product.hasMany(Like, { foreignKey: "productId", as: "likes" });
Product.hasMany(Comment, { foreignKey: "productId", as: "comments" });
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
Product.hasMany(CartItem, { foreignKey: "productId", as: "cartItems" });

// Order associations
Order.belongsTo(User, { foreignKey: "userId", as: "user" });
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "orderItems" });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Cart associations
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });
Cart.hasMany(CartItem, { foreignKey: "cartId", as: "cartItems" });

// CartItem associations
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Like associations
Like.belongsTo(User, { foreignKey: "userId", as: "user" });
Like.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Comment associations
Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
Comment.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Add unique constraints
Like.addHook("beforeCreate", async (like) => {
  const existingLike = await Like.findOne({
    where: {
      userId: like.userId,
      productId: like.productId,
    },
  });
  if (existingLike) {
    throw new Error("User has already liked this product");
  }
});

module.exports = {
  sequelize,
  Sequelize,
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Like,
  Comment,
};
