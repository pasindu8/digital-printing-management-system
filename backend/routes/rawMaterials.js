const express = require('express');
const c = require('../controllers/rawMaterialController');
const router = express.Router();

// Basic CRUD operations
router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

// Stock management
router.patch('/:id/stock', c.adjustStock);

// Inventory management features
router.get('/alerts/low-stock', c.getLowStockAlerts);
router.get('/reports/inventory', c.getInventoryReport);

// Order-related material tracking
router.get('/orders/:orderId/materials', c.getMaterialsForOrder);
router.post('/orders/:orderId/usage', c.recordMaterialUsage);

// Pricing management
router.post('/pricing/calculate', c.setProductPricing);

module.exports = router;