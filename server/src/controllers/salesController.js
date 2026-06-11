
const { sequelize } = require('../config/database');
const Sale = require('../models/sale');
const Product = require('../models/product');

exports.getAllSales = async (req, res) => {
    try {
        const sales = await Sale.findAll();
        res.status(200).json({ sales });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findByPk(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        res.status(200).json({ sale });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

exports.createSale = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity) {
            return res.status(400).json({ message: 'Product ID and quantity are required' });
        }

        const result = await sequelize.transaction(async (t) => {
            const product = await Product.findByPk(product_id, { transaction: t });
            if (!product) {
                throw new Error('Product not found');
            }

            if (product.stock_quantity < quantity) {
                throw new Error('Insufficient stock');
            }

            const total_price = parseFloat(product.price) * quantity;

            const sale = await Sale.create({
                product_id,
                user_id: req.userId,
                quantity,
                total_price
            }, { transaction: t });

            await product.update({
                stock_quantity: product.stock_quantity - quantity
            }, { transaction: t });

            return sale;
        });

        res.status(201).json({ message: 'Sale created successfully', sale: result });
    } catch (error) {
        const status = error.message === 'Product not found' ? 404
            : error.message === 'Insufficient stock' ? 400
            : 500;
        res.status(status).json({ message: error.message });
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sales = await Sale.findAll({
            where: {
                date: { [require('sequelize').Op.gte]: today }
            }
        });
        res.status(200).json({ sales });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching daily sales', error: error.message });
    }
};
