const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deviceType: {
    type: DataTypes.STRING,
    defaultValue: 'pos-terminal',
  },
  deviceToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastSeenAt: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Device;
