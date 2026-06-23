const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pinHash: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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

User.associate = (models) => {
    User.hasMany(models.Sale, { foreignKey: 'user_id' });
};

module.exports = User;
