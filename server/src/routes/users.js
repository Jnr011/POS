const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const User = require('../models/user');

function serverTimestamp() {
  return Date.now();
}

// GET /api/users — list all active users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['pinHash', 'password'] },
      raw: true,
    });
    res.json({ data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['pinHash', 'password'] },
      raw: true,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', message: err.message });
  }
});

// POST /api/users — create user
router.post('/', async (req, res) => {
  try {
    const user = await User.create({ ...req.body, updatedAt: serverTimestamp() });
    const { pinHash, password, ...safe } = user.toJSON();
    res.status(201).json({ data: safe });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user', message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ ...req.body, updatedAt: serverTimestamp() });
    const { pinHash, password, ...safe } = user.toJSON();
    res.json({ data: safe });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', message: err.message });
  }
});

// DELETE /api/users/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: false, deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate user', message: err.message });
  }
});

module.exports = router;
