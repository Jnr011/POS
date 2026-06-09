
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// All inventory routes require authentication
router.use(authMiddleware);

router.get('/', inventoryController.getAllProducts);
router.post('/batch-import', inventoryController.batchImportProducts);
router.get('/stock/low', inventoryController.getLowStockProducts);
router.get('/:id', inventoryController.getProductById);
router.post('/', inventoryController.createProduct);
router.put('/:id', inventoryController.updateProduct);
router.delete('/:id', inventoryController.deleteProduct);

module.exports = router;
