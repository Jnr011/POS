const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Product = require('../models/product');
const Sale = require('../models/sale');

router.post('/', auth, async (req, res) => {
  try {
    const { mutations } = req.body;
    const results = [];

    for (const mutation of mutations) {
      try {
        switch (mutation.table) {
          case 'products':
            if (mutation.action === 'create') {
              const p = await Product.create(mutation.data);
              results.push({ success: true, id: p.id, localId: mutation.recordId });
            } else if (mutation.action === 'update') {
              const p = await Product.findByPk(mutation.recordId);
              if (p) {
                await p.update(mutation.data);
                results.push({ success: true, id: p.id, localId: mutation.recordId });
              } else {
                results.push({ success: false, localId: mutation.recordId, error: 'Not found' });
              }
            } else if (mutation.action === 'delete') {
              await Product.destroy({ where: { id: mutation.recordId } });
              results.push({ success: true, localId: mutation.recordId });
            }
            break;
          case 'sales':
            if (mutation.action === 'create') {
              const s = await Sale.create({ ...mutation.data, user_id: req.userId });
              results.push({ success: true, id: s.id, localId: mutation.recordId });
            }
            break;
        }
      } catch (err) {
        results.push({ success: false, localId: mutation.recordId, error: err.message });
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Sync failed', error: err.message });
  }
});

module.exports = router;
