const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Return = sequelize.define('Return', {
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  refundTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
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

module.exports = Return;
