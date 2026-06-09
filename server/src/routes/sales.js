
const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const authMiddleware = require('../middleware/authMiddleware');

// All sales routes require authentication
router.use(authMiddleware);

router.get('/', salesController.getAllSales);
router.get('/daily/summary', salesController.getDailySales);
router.post('/', salesController.createSale);
router.get('/:id', salesController.getSaleById);

module.exports = router;
