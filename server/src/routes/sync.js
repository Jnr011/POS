const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const router = express.Router();
const Device = require('../models/device');
const Product = require('../models/product');
const Sale = require('../models/sale');
const User = require('../models/user');
const Return = require('../models/return');
const { SyncPushLog, SyncPullLog } = require('../models/syncLog');
const { deviceAuth } = require('../middleware/auth');
const syncConfig = require('../config/sync');
const cloudSync = require('../services/cloudSync');

function serverTimestamp() {
  return Date.now();
}

const ALLOWED_TABLES = ['products', 'sales', 'users', 'returns'];

function getModel(table) {
  const map = { products: Product, sales: Sale, users: User, returns: Return };
  return map[table];
}

// GET /api/sync/pull — serve changes since timestamp with pagination
router.get('/pull', async (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    const since = parseInt(req.query.since, 10) || 0;
    const ts = serverTimestamp();
    const changes = {};

    for (const table of ALLOWED_TABLES) {
      try {
        const Model = getModel(table);
        const rows = await Model.findAll({
          where: {
            [Op.or]: [
              { updatedAt: { [Op.gt]: since } },
              { receivedAt: { [Op.gt]: since } },
            ],
          },
          limit: syncConfig.local.pullMaxPerTable,
          order: [['updatedAt', 'ASC']],
          raw: true,
        });

        // If the requesting device made the change and it's already marked syncedToDevice, exclude it
        const filtered = rows.filter(r => {
          if (r.deviceId === deviceId && r.syncedToDevice) return false;
          if (r.deletedAt) return false; // soft deletes handled separately
          return true;
        });

        changes[table] = filtered;
      } catch (err) {
        changes[table] = [];
      }
    }

    // Include a separate list of soft-deleted record IDs for cleanup
    const deletes = {};
    for (const table of ALLOWED_TABLES) {
      try {
        const Model = getModel(table);
        const deleted = await Model.findAll({
          where: {
            deletedAt: { [Op.gt]: since },
          },
          attributes: ['id', 'updatedAt', 'deviceId'],
          raw: true,
        });
        if (deleted.length > 0) deletes[table] = deleted;
      } catch {}
    }

    if (deviceId) {
      try {
        await Device.update({ lastSeenAt: ts }, { where: { deviceId } });
        await SyncPullLog.create({ deviceId, since, changesCount: Object.values(changes).flat().length, createdAt: ts });
      } catch {}
    }

    res.json({
      changes,
      deletes: Object.keys(deletes).length > 0 ? deletes : undefined,
      serverTimestamp: ts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Pull failed', message: err.message });
  }
});

// POST /api/sync/push — accept batch mutations from POS devices
router.post('/push', async (req, res) => {
  try {
    const { deviceId, batch } = req.body;
    if (!deviceId || !Array.isArray(batch)) {
      return res.status(400).json({ error: 'deviceId and batch[] required' });
    }

    const errors = [];
    let accepted = 0;
    const ts = serverTimestamp();

    for (let i = 0; i < batch.length; i++) {
      const mutation = batch[i];
      try {
        const mutationTs = mutation.timestamp || ts;
        const table = mutation.table;
        const action = mutation.action;

        if (!ALLOWED_TABLES.includes(table)) {
          errors.push({ index: i, reason: `Unknown table: ${table}` });
          continue;
        }

        const Model = getModel(table);

        if (action === 'create') {
          const data = {
            ...mutation.data,
            deviceId,
            sourceDevice: deviceId,
            updatedAt: mutationTs,
            receivedAt: ts,
            syncedToCloud: 0,
            syncedToDevice: 0,
          };
          await Model.create(data);
          accepted++;
        } else if (action === 'update') {
          const existing = await Model.findByPk(mutation.recordId);
          if (existing) {
            const existingTs = existing.updatedAt || 0;
            if (mutationTs >= existingTs) {
              await existing.update({
                ...mutation.data,
                updatedAt: mutationTs,
                receivedAt: ts,
                syncedToCloud: 0,
                syncedToDevice: 0,
              });
            }
            accepted++;
          } else {
            // Record doesn't exist on server yet — create it
            const data = {
              ...mutation.data,
              id: mutation.recordId,
              deviceId,
              sourceDevice: deviceId,
              updatedAt: mutationTs,
              receivedAt: ts,
              syncedToCloud: 0,
              syncedToDevice: 0,
            };
            try {
              await Model.create(data);
            } catch {
              errors.push({ index: i, reason: 'Failed to create missing record' });
            }
            accepted++;
          }
        } else if (action === 'delete') {
          const existing = await Model.findByPk(mutation.recordId);
          if (existing) {
            await existing.update({ deletedAt: ts, updatedAt: mutationTs, syncedToCloud: 0, syncedToDevice: 0 });
          }
          accepted++;
        } else if (action === 'upsert') {
          const data = {
            ...mutation.data,
            deviceId: mutation.data.deviceId || deviceId,
            updatedAt: mutationTs,
            receivedAt: ts,
            syncedToCloud: 0,
            syncedToDevice: 0,
          };
          const id = mutation.recordId || mutation.data?.id;
          if (id) {
            const existing = await Model.findByPk(id);
            if (existing) {
              await existing.update(data);
            } else {
              await Model.create({ ...data, id });
            }
          } else {
            await Model.create(data);
          }
          accepted++;
        }
      } catch (err) {
        errors.push({ index: i, reason: err.message });
      }
    }

    try {
      if (deviceId) {
        await Device.update({ lastSeenAt: ts }, { where: { deviceId } });
      }
      await SyncPushLog.create({ deviceId, batchSize: batch.length, accepted, rejected: errors.length, createdAt: ts });
    } catch {}

    res.json({
      accepted,
      rejected: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      serverTimestamp: ts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Push failed', message: err.message });
  }
});

// POST /api/sync/register — register a device for sync
router.post('/register', async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const [device, created] = await Device.findOrCreate({
      where: { deviceId },
      defaults: {
        deviceId,
        deviceName: deviceName || 'POS Terminal',
        deviceType: deviceType || 'pos-terminal',
        deviceToken: crypto.randomBytes(32).toString('hex'),
        lastSeenAt: serverTimestamp(),
      },
    });

    if (!created) {
      await device.update({
        deviceName: deviceName || device.deviceName,
        lastSeenAt: serverTimestamp(),
      });
    }

    res.json({
      deviceToken: device.deviceToken,
      serverTimestamp: serverTimestamp(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// GET /api/sync/status — sync health check with counts
router.get('/status', async (req, res) => {
  try {
    const deviceCount = await Device.count();
    const productCount = await Product.count({ where: { deletedAt: null } });
    const saleCount = await Sale.count({ where: { deletedAt: null } });
    const userCount = await User.count({ where: { deletedAt: null } });
    const returnCount = await Return.count({ where: { deletedAt: null } });

    const pendingCloud = await Product.count({ where: { syncedToCloud: 0, deletedAt: null } })
      + await Sale.count({ where: { syncedToCloud: 0, deletedAt: null } })
      + await User.count({ where: { syncedToCloud: 0, deletedAt: null } });

    res.json({
      status: 'ok',
      serverTimestamp: serverTimestamp(),
      stats: {
        devices: deviceCount,
        products: productCount,
        sales: saleCount,
        users: userCount,
        returns: returnCount,
        pendingCloudSync: pendingCloud,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', message: err.message });
  }
});

// POST /api/sync/force — trigger immediate cloud sync
router.post('/force', async (req, res) => {
  try {
    const result = await cloudSync.doCloudSync();
    res.json({ status: 'ok', result });
  } catch (err) {
    res.status(500).json({ error: 'Force sync failed', message: err.message });
  }
});

// POST /api/sync/reset — wipe ALL data (dev only, no auth guard)
router.post('/reset', async (req, res) => {
  try {
    await Product.destroy({ where: {}, force: true });
    await Sale.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Device.destroy({ where: {}, force: true });
    await Return.destroy({ where: {}, force: true });

    res.json({ status: 'ok', message: 'All data wiped' });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed', message: err.message });
  }
});

module.exports = router;
