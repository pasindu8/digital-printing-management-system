const MaterialOrder = require('../models/Material_orders');
const RawMaterial = require('../models/Raw_materials');
const { Expense, LedgerEntry } = require('../models/Finance');
const asyncHandler = require('../utils/asyncHandler');
const { sendSupplierOrderNotification } = require('../utils/supplierEmailService');

exports.create = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.create(req.body);
  
  // Send email notification to supplier
  try {
    const emailResult = await sendSupplierOrderNotification(order);
    
    if (emailResult.success) {
      console.log(`✅ Supplier notification sent for order ${order.order_id}`);
    } else {
      console.log(`⚠️ Failed to send supplier notification for order ${order.order_id}: ${emailResult.message}`);
    }
    
    // Add email status to response
    order._doc.emailNotification = emailResult;
    
  } catch (emailError) {
    console.error('Error sending supplier notification:', emailError);
    // Don't fail the order creation if email fails
    order._doc.emailNotification = {
      success: false,
      message: 'Email notification failed',
      error: emailError.message
    };
  }
  
  res.status(201).json(order);
});

exports.list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const q = {};
  if (status) q.status = status;
  const orders = await MaterialOrder.find(q)
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders);
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOne({ order_id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

exports.update = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOneAndUpdate(
    { order_id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

exports.remove = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOneAndDelete({ order_id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Mark delivered + update stock (minus damaged) + create expense entry
exports.markDelivered = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOne({ order_id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.status === 'Delivered')
    return res.status(400).json({ error: 'Already delivered' });

  order.status = 'Delivered';
  order.delivery_date = new Date();
  await order.save();

  const usableQty = order.quantity_ordered - (order.damaged_items_amount || 0);

  if (usableQty > 0) {
    const material = await RawMaterial.findOne({ material_id: order.material_id });
    if (material) {
      material.current_stock += usableQty;
      await material.save();
    }
  }

  // Automatically create expense entry for material order
  try {
    const expenseData = {
      expenseId: 'EXP-MAT-' + Date.now(),
      category: 'Materials',
      description: `Material Order ${order.order_id} - ${order.material_id}`,
      amount: order.total_price,
      date: new Date(),
      vendor: order.supplier_id,
      paymentMethod: 'Bank Transfer', // Default payment method
      status: 'Paid',
      createdBy: 'System'
    };

    const expense = new Expense(expenseData);
    await expense.save();

    // Create ledger entry for expense
    const ledgerEntry = new LedgerEntry({
      entryId: 'LE-MAT-' + Date.now(),
      description: `Material Expense: ${order.order_id}`,
      reference: expenseData.expenseId,
      account: 'Expenses',
      credit: order.total_price,
      category: 'Expense'
    });
    await ledgerEntry.save();

    console.log(`Automatically created expense entry for material order ${order.order_id}: ${order.total_price}`);
  } catch (expenseError) {
    console.error('Error creating expense entry for material order:', expenseError);
    // Don't fail the entire operation if expense creation fails
  }

  res.json(order);
});

// Set damaged items (before delivery)
exports.setDamaged = asyncHandler(async (req, res) => {
  const { damaged_items_amount } = req.body;
  const order = await MaterialOrder.findOne({ order_id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (damaged_items_amount > order.quantity_ordered)
    return res.status(400).json({ error: 'Invalid damaged amount' });
  order.damaged_items_amount = damaged_items_amount;
  await order.save();
  res.json(order);
});

// Finance transfer
exports.markTransferred = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOneAndUpdate(
    { order_id: req.params.id },
    { finance_transfer_status: 'Transferred' },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

// Resend supplier notification email
exports.resendSupplierNotification = asyncHandler(async (req, res) => {
  const order = await MaterialOrder.findOne({ order_id: req.params.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  try {
    const emailResult = await sendSupplierOrderNotification(order);
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Supplier notification sent successfully',
        order_id: order.order_id,
        sent_to: emailResult.sentTo,
        email_result: emailResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send supplier notification',
        order_id: order.order_id,
        error: emailResult.message
      });
    }
  } catch (error) {
    console.error('Error resending supplier notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending supplier notification',
      error: error.message
    });
  }
});