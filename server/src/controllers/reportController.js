
const Sale = require('../models/sale');
const Product = require('../models/product');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.getDailySalesReport = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sales = await Sale.findAll({
            where: {
                date: { [Op.gte]: today }
            }
        });
        const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);
        res.status(200).json({ dailySales: sales, totalAmount: totalSales });
    } catch (error) {
        res.status(500).json({ message: 'Error generating sales report', error: error.message });
    }
};

exports.getWeeklySalesReport = async (req, res) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const sales = await Sale.findAll({
            where: {
                date: { [Op.gte]: startDate }
            }
        });
        const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);
        res.status(200).json({ weeklySales: sales, totalAmount: totalSales });
    } catch (error) {
        res.status(500).json({ message: 'Error generating weekly report', error: error.message });
    }
};

exports.getMonthlySalesReport = async (req, res) => {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const sales = await Sale.findAll({
            where: {
                date: { [Op.gte]: startDate }
            }
        });
        const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price), 0);
        res.status(200).json({ monthlySales: sales, totalAmount: totalSales });
    } catch (error) {
        res.status(500).json({ message: 'Error generating monthly report', error: error.message });
    }
};

exports.getInventoryStatusReport = async (req, res) => {
    try {
        const products = await Product.findAll();
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
        const lowStockCount = products.filter(p => p.stock_quantity < 10).length;
        res.status(200).json({ 
            totalProducts: products.length, 
            totalValue,
            lowStockProducts: lowStockCount,
            products
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating inventory report', error: error.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Sale.findAll({
            attributes: [
                'product_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantitySold']
            ],
            group: ['product_id'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
            limit: 10
        });
        res.status(200).json({ topProducts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching top products', error: error.message });
    }
};

exports.generateSalesReport = async (req, res) => {
    exports.getDailySalesReport(req, res);
};

exports.generateInventoryReport = async (req, res) => {
    exports.getInventoryStatusReport(req, res);
};
