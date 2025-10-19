const express = require('express');
const multer = require('multer');
const path = require('path');
const c = require('../controllers/rawMaterialController');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/raw-materials/');
  },
  filename: function (req, file, cb) {
    cb(null, 'material_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Basic CRUD operations
router.post('/', upload.single('image'), c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.put('/:id', upload.single('image'), c.update);
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