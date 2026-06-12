const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    items: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('items');
            return raw ? JSON.parse(raw) : [];
        },
        set(val) {
            this.setDataValue('items', JSON.stringify(val));
        },
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    amount_tendered: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    change_due: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
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
}, {
    timestamps: false,
});

Sale.associate = (models) => {
    Sale.belongsTo(models.Product, { foreignKey: 'product_id' });
    Sale.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = Sale;
