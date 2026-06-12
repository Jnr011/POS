const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const router = express.Router();
const Device = require('../models/device');
const Product = require('../models/product');
const Sale = require('../models/sale');
const User = require('../models/user');
const syncConfig = require('../config/sync');

function serverTimestamp() {
  return Date.now();
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

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
        deviceToken: generateToken(),
        lastSeenAt: serverTimestamp(),
      },
    });

    if (!created) {
      await device.update({
        deviceName: deviceName || device.deviceName,
        lastSeenAt: serverTimestamp(),
        deviceToken: device.deviceToken || generateToken(),
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

// POST /api/sync/push — accept batch mutations from clients
router.post('/push', async (req, res) => {
  try {
    const { deviceId, batch } = req.body;
    if (!deviceId || !Array.isArray(batch)) {
      return res.status(400).json({ error: 'deviceId and batch[] required' });
    }

    const errors = [];
    let accepted = 0;

    for (let i = 0; i < batch.length; i++) {
      const mutation = batch[i];
      try {
        const ts = mutation.timestamp || serverTimestamp();

        switch (mutation.table) {
          case 'products': {
            if (mutation.action === 'create') {
              await Product.create({ ...mutation.data, updatedAt: ts });
              accepted++;
            } else if (mutation.action === 'update') {
              const existing = await Product.findByPk(mutation.recordId);
              if (existing) {
                const existingTs = existing.updatedAt || 0;
                if (ts >= existingTs) {
                  await existing.update({ ...mutation.data, updatedAt: ts });
                }
                accepted++;
              }
            } else if (mutation.action === 'delete') {
              await Product.destroy({ where: { id: mutation.recordId } });
              accepted++;
            }
            break;
          }

          case 'sales': {
            if (mutation.action === 'create') {
              await Sale.create({ ...mutation.data, updatedAt: ts });
              accepted++;
            }
            break;
          }

          case 'users': {
            if (mutation.action === 'create') {
              const existingUser = mutation.data?.email
                ? await User.findOne({ where: { email: mutation.data.email } })
                : null;
              if (!existingUser) {
                await User.create({ ...mutation.data, updatedAt: ts });
              }
              accepted++;
            } else if (mutation.action === 'update') {
              const existing = await User.findByPk(mutation.recordId);
              if (existing) {
                await existing.update({ ...mutation.data, updatedAt: ts });
                accepted++;
              }
            }
            break;
          }

          default:
            errors.push({ index: i, reason: `Unknown table: ${mutation.table}` });
        }
      } catch (err) {
        errors.push({ index: i, reason: err.message });
      }
    }

    if (deviceId) {
      await Device.update({ lastSeenAt: serverTimestamp() }, { where: { deviceId } });
    }

    res.json({
      accepted,
      rejected: errors.length,
      errors,
      serverTimestamp: serverTimestamp(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Push failed', message: err.message });
  }
});

// GET /api/sync/pull — return all records (client-side conflict resolution)
router.get('/pull', async (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    const ts = serverTimestamp();

    const products = await Product.findAll({ raw: true });
    const sales = await Sale.findAll({ raw: true });
    const users = await User.findAll({ raw: true });

    if (deviceId) {
      await Device.update({ lastSeenAt: ts }, { where: { deviceId } });
    }

    res.json({
      changes: { products, sales, users },
      serverTimestamp: ts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Pull failed', message: err.message });
  }
});

// GET /api/sync/status — sync health check
router.get('/status', async (req, res) => {
  try {
    const deviceCount = await Device.count();
    const productCount = await Product.count();
    const saleCount = await Sale.count();
    const userCount = await User.count();

    res.json({
      status: 'ok',
      serverTimestamp: serverTimestamp(),
      stats: { devices: deviceCount, products: productCount, sales: saleCount, users: userCount },
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', message: err.message });
  }
});

module.exports = router;
