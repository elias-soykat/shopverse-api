module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
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
      orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [5, 50],
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "refunded"
        ),
        defaultValue: "pending",
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          notEmpty: true,
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          notEmpty: true,
        },
      },
      taxAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      shippingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      shippingAddress: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
          isValidAddress(value) {
            if (!value || typeof value !== "object") {
              throw new Error("Shipping address must be an object");
            }
            if (
              !value.street ||
              !value.city ||
              !value.state ||
              !value.zipCode ||
              !value.country
            ) {
              throw new Error(
                "Shipping address must include street, city, state, zipCode, and country"
              );
            }
          },
        },
      },
      billingAddress: {
        type: DataTypes.JSON,
        allowNull: false,
        validate: {
          isValidAddress(value) {
            if (!value || typeof value !== "object") {
              throw new Error("Billing address must be an object");
            }
            if (
              !value.street ||
              !value.city ||
              !value.state ||
              !value.zipCode ||
              !value.country
            ) {
              throw new Error(
                "Billing address must include street, city, state, zipCode, and country"
              );
            }
          },
        },
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [2, 50],
          notEmpty: true,
        },
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedDelivery: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      hooks: {
        beforeCreate: (order) => {
          if (!order.orderNumber) {
            order.orderNumber = `ORD-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)
              .toUpperCase()}`;
          }
        },
      },
    }
  );

  return Order;
};
