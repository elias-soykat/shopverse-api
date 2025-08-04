module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Cart expiration date (for abandoned carts)",
      },
    },
    {
      tableName: "carts",
      timestamps: true,
      hooks: {
        beforeCreate: (cart) => {
          // Set cart to expire in 30 days if not specified
          if (!cart.expiresAt) {
            cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        },
      },
    }
  );

  return Cart;
};
