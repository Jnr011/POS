const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Device = require('../models/device');
const User = require('../models/user');
const { generateToken } = require('../middleware/auth');
const { deviceAuth } = require('../middleware/auth');

function serverTimestamp() {
  return Date.now();
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// POST /api/auth/register — register a new device (no auth required, first-time setup)
router.post('/register', async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, adminEmail, adminPin } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Validate admin credentials if provided (multi-store: verify against cloud)
    if (adminEmail && adminPin) {
      const admin = await User.findOne({ where: { email: adminEmail, role: 'admin' } });
      if (!admin || admin.pinHash !== hashPin(adminPin)) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
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

    const token = generateToken({ deviceId: device.deviceId, deviceToken: device.deviceToken });

    res.json({
      deviceId: device.deviceId,
      deviceToken: device.deviceToken,
      token,
      serverConfig: {
        storeName: 'Pharmacy POS',
        taxRate: 0.1,
        currency: 'GHS',
      },
      initialSince: serverTimestamp(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

// POST /api/auth/refresh — refresh device token (authenticated)
router.post('/refresh', deviceAuth, async (req, res) => {
  try {
    const newToken = crypto.randomBytes(32).toString('hex');
    await req.device.update({ deviceToken: newToken });
    const jwt = generateToken({ deviceId: req.device.deviceId, deviceToken: newToken });
    res.json({ deviceToken: newToken, token: jwt });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed', message: err.message });
  }
});

// POST /api/auth/login — admin login (returns JWT for admin panel)
router.post('/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      return res.status(400).json({ error: 'Email and pin required' });
    }

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user || user.pinHash !== hashPin(pin)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

module.exports = router;
