const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    barcode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    min_stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    supplier: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    updatedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    syncedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    syncStatus: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sourceDevice: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    syncedToCloud: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    syncedToDevice: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    deletedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    receivedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    timestamps: false,
});

Product.associate = (models) => {
    Product.hasMany(models.Sale, { foreignKey: 'product_id' });
};

module.exports = Product;
