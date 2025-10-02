const express = require('express');
const c = require('../controllers/materialOrderController');
const router = express.Router();

router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
router.post('/:id/deliver', c.markDelivered);
router.post('/:id/damaged', c.setDamaged);
router.post('/:id/transfer', c.markTransferred);
router.post('/:id/resend-notification', c.resendSupplierNotification);

module.exports = router;