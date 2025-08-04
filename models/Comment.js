module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
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
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [10, 1000],
          notEmpty: true,
        },
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
          isInt: true,
          notEmpty: true,
        },
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "comments",
      timestamps: true,
      hooks: {
        beforeUpdate: (comment) => {
          if (comment.changed("content") && !comment.isEdited) {
            comment.isEdited = true;
            comment.editedAt = new Date();
          }
        },
      },
    }
  );

  return Comment;
};
