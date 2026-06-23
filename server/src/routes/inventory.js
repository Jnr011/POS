const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const Product = require('../models/product');

function serverTimestamp() {
  return Date.now();
}

// GET /api/inventory — list all products (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, lowStock, expiring } = req.query;
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { barcode: { [Op.like]: `%${search}%` } },
      ];
    }
    if (lowStock === 'true') {
      where[Op.and] = [
        { stock_quantity: { [Op.gt]: 0 } },
        sequelize.where(sequelize.col('stock_quantity'), '<=', sequelize.col('min_stock')),
      ];
    }

    const products = await Product.findAll({ where, order: [['name', 'ASC']], raw: true });
    res.json({ data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', message: err.message });
  }
});

// GET /api/inventory/categories — distinct categories
router.get('/categories', async (req, res) => {
  try {
    const products = await Product.findAll({ attributes: ['category'], group: ['category'], raw: true });
    const categories = [...new Set(products.map(p => p.category))].sort();
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories', message: err.message });
  }
});

// GET /api/inventory/:id — single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { raw: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product', message: err.message });
  }
});

// POST /api/inventory — create product
router.post('/', async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, updatedAt: serverTimestamp() });
    res.status(201).json({ data: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product', message: err.message });
  }
});

// PUT /api/inventory/:id — update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update({ ...req.body, updatedAt: serverTimestamp() });
    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', message: err.message });
  }
});

// DELETE /api/inventory/:id — soft delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.update({ deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', message: err.message });
  }
});

module.exports = router;
