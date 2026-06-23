const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const Sale = require('../models/sale');
const Product = require('../models/product');
const sequelize = require('../config/database');

function serverTimestamp() {
  return Date.now();
}

// GET /api/sales — list sales with optional filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, userId, limit, offset } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    if (paymentMethod && paymentMethod !== 'all') where.payment_method = paymentMethod;
    if (userId) where.user_id = parseInt(userId, 10);

    const sales = await Sale.findAll({
      where,
      order: [['id', 'DESC']],
      limit: parseInt(limit, 10) || 100,
      offset: parseInt(offset, 10) || 0,
      raw: true,
    });

    const count = await Sale.count({ where });
    res.json({ data: sales, count, limit: parseInt(limit, 10) || 100, offset: parseInt(offset, 10) || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales', message: err.message });
  }
});

// GET /api/sales/summary — aggregated sales data
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    const sales = await Sale.findAll({ where, raw: true });
    const totalRevenue = sales.reduce((s, r) => s + parseFloat(r.grand_total || 0), 0);
    const totalTax = sales.reduce((s, r) => s + parseFloat(r.tax || 0), 0);
    const transactionCount = sales.length;

    res.json({
      totalRevenue,
      totalTax,
      transactionCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary', message: err.message });
  }
});

// GET /api/sales/:id — single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, { raw: true });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json({ data: sale });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale', message: err.message });
  }
});

// POST /api/sales — create sale
router.post('/', async (req, res) => {
  try {
    const sale = await Sale.create({ ...req.body, updatedAt: serverTimestamp() });
    res.status(201).json({ data: sale });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sale', message: err.message });
  }
});

module.exports = router;
