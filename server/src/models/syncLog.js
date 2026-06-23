const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SyncPushLog = sequelize.define('SyncPushLog', {
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  batchSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accepted: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rejected: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: false,
});

const SyncPullLog = sequelize.define('SyncPullLog', {
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  since: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  changesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: false,
});

const CloudSyncMeta = sequelize.define('CloudSyncMeta', {
  tableName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  lastPushedAt: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  lastPulledAt: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pushCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pullCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastError: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = { SyncPushLog, SyncPullLog, CloudSyncMeta };
