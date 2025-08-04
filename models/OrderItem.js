module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          isInt: true,
          notEmpty: true,
        },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          notEmpty: true,
        },
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          notEmpty: true,
        },
      },
      productSnapshot: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Snapshot of product data at time of order",
      },
    },
    {
      tableName: "order_items",
      timestamps: true,
      hooks: {
        beforeCreate: (orderItem) => {
          if (orderItem.quantity && orderItem.unitPrice) {
            orderItem.totalPrice = orderItem.quantity * orderItem.unitPrice;
          }
        },
        beforeUpdate: (orderItem) => {
          if (orderItem.changed("quantity") || orderItem.changed("unitPrice")) {
            orderItem.totalPrice = orderItem.quantity * orderItem.unitPrice;
          }
        },
      },
    }
  );

  return OrderItem;
};
