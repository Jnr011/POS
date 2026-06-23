const axios = require('axios');
const { Op } = require('sequelize');
const Product = require('../models/product');
const Sale = require('../models/sale');
const User = require('../models/user');
const Return = require('../models/return');
const { CloudSyncMeta } = require('../models/syncLog');
const syncConfig = require('../config/sync');
const sequelize = require('../config/database');

const TABLES = ['products', 'sales', 'users', 'returns'];

function getModel(table) {
  const map = { products: Product, sales: Sale, users: User, returns: Return };
  return map[table];
}

function now() {
  return Date.now();
}

async function initializeMeta() {
  for (const table of TABLES) {
    await CloudSyncMeta.findOrCreate({
      where: { tableName: table },
      defaults: { tableName: table, lastPushedAt: 0, lastPulledAt: 0, pushCount: 0, pullCount: 0 },
    });
  }
}

async function pushToCloud() {
  const cfg = syncConfig.cloud;
  if (!cfg.enabled || !cfg.endpoint) return { pushed: 0, errors: [] };

  let totalPushed = 0;
  const errors = [];

  for (const table of TABLES) {
    try {
      const meta = await CloudSyncMeta.findOne({ where: { tableName: table } });
      const lastPushed = meta ? meta.lastPushedAt : 0;
      const Model = getModel(table);
      const rows = await Model.findAll({
        where: {
          updatedAt: { [Op.gt]: lastPushed },
          deletedAt: null,
        },
        limit: cfg.batchSize,
        raw: true,
      });

      if (rows.length === 0) continue;

      const batch = rows.map(r => ({
        table,
        action: 'upsert',
        data: r,
        timestamp: r.updatedAt || now(),
      }));

      try {
        const res = await axios.post(`${cfg.endpoint}/api/cloud/sync/push`, {
          apiKey: cfg.apiKey,
          batch,
        }, { timeout: 30000 });

        if (res.data?.accepted > 0) {
          const maxTs = Math.max(...rows.map(r => r.updatedAt || 0));
          await CloudSyncMeta.update(
            { lastPushedAt: maxTs, pushCount: (meta?.pushCount || 0) + rows.length, lastError: null },
            { where: { tableName: table } }
          );
          totalPushed += res.data.accepted;
        }
      } catch (err) {
        const msg = err.message || String(err);
        await CloudSyncMeta.update(
          { lastError: msg },
          { where: { tableName: table } }
        );
        errors.push({ table, error: msg });
      }
    } catch (err) {
      errors.push({ table, error: err.message });
    }
  }

  return { pushed: totalPushed, errors };
}

async function pullFromCloud() {
  const cfg = syncConfig.cloud;
  if (!cfg.enabled || !cfg.endpoint) return { pulled: 0, errors: [] };

  let totalPulled = 0;
  const errors = [];

  for (const table of TABLES) {
    try {
      const meta = await CloudSyncMeta.findOne({ where: { tableName: table } });
      const lastPulled = meta ? meta.lastPulledAt : 0;
      const Model = getModel(table);

      const res = await axios.get(`${cfg.endpoint}/api/cloud/sync/pull`, {
        params: { since: lastPulled, table },
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
        timeout: 30000,
      });

      const changes = res.data?.changes || [];
      if (changes.length === 0) continue;

      for (const record of changes) {
        if (record.deletedAt) {
          await Model.destroy({ where: { id: record.id } });
        } else {
          const existing = await Model.findByPk(record.id);
          if (existing) {
            if ((record.updatedAt || 0) > (existing.updatedAt || 0)) {
              await existing.update(record);
            }
          } else {
            await Model.create(record);
          }
        }
      }

      const maxTs = Math.max(...changes.map(c => c.updatedAt || 0));
      await CloudSyncMeta.update(
        { lastPulledAt: maxTs, pullCount: (meta?.pullCount || 0) + changes.length, lastError: null },
        { where: { tableName: table } }
      );
      totalPulled += changes.length;
    } catch (err) {
      const msg = err.message || String(err);
      await CloudSyncMeta.update(
        { lastError: msg },
        { where: { tableName: table } }
      );
      errors.push({ table, error: msg });
    }
  }

  return { pulled: totalPulled, errors };
}

let intervalTimer = null;
let isSyncing = false;

async function doCloudSync() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const pushResult = await pushToCloud();
    if (pushResult.pushed > 0) {
      console.log(`[CloudSync] Pushed ${pushResult.pushed} records`);
    }
    const pullResult = await pullFromCloud();
    if (pullResult.pulled > 0) {
      console.log(`[CloudSync] Pulled ${pullResult.pulled} records`);
    }
  } catch (err) {
    console.error(`[CloudSync] Error: ${err.message}`);
  } finally {
    isSyncing = false;
  }
}

function start() {
  const cfg = syncConfig.cloud;
  if (!cfg.enabled || !cfg.endpoint) {
    console.log('[CloudSync] Disabled — no endpoint configured');
    return;
  }

  initializeMeta().then(() => {
    console.log(`[CloudSync] Started (interval: ${cfg.intervalMs / 1000}s)`);
    doCloudSync();
    intervalTimer = setInterval(doCloudSync, cfg.intervalMs);
  });
}

function stop() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

module.exports = { start, stop, doCloudSync, pushToCloud, pullFromCloud, initializeMeta };
