
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
    }
});

Product.associate = (models) => {
    Product.hasMany(models.Sale, { foreignKey: 'product_id' });
};

module.exports = Product;
