
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// All report routes require authentication
router.use(authMiddleware);

router.get('/sales/daily', reportController.getDailySalesReport);
router.get('/sales/weekly', reportController.getWeeklySalesReport);
router.get('/sales/monthly', reportController.getMonthlySalesReport);
router.get('/inventory/status', reportController.getInventoryStatusReport);
router.get('/top-products', reportController.getTopProducts);

module.exports = router;
