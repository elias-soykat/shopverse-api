module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          len: [2, 200],
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [10, 2000],
          notEmpty: true,
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          notEmpty: true,
        },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          isInt: true,
        },
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        validate: {
          isValidImages(value) {
            if (value && !Array.isArray(value)) {
              throw new Error("Images must be an array");
            }
            if (
              value &&
              value.some((img) => typeof img !== "string" || !img.trim())
            ) {
              throw new Error("All images must be valid URLs");
            }
          },
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      sku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          notEmpty: true,
        },
      },
      slug: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        validate: {
          len: [2, 200],
          notEmpty: true,
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      dimensions: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidDimensions(value) {
            if (value && typeof value !== "object") {
              throw new Error("Dimensions must be an object");
            }
            if (value && (!value.length || !value.width || !value.height)) {
              throw new Error(
                "Dimensions must include length, width, and height"
              );
            }
          },
        },
      },
      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      tableName: "products",
      timestamps: true,
      hooks: {
        beforeCreate: (product) => {
          if (!product.slug) {
            product.slug = product.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
          }
          if (!product.sku) {
            product.sku = `SKU-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
        },
        beforeUpdate: (product) => {
          if (product.changed("name") && !product.changed("slug")) {
            product.slug = product.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
          }
        },
      },
    }
  );

  return Product;
};
