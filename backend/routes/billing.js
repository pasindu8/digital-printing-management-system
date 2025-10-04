const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const Order = require('../models/Order');
const { authRequired, permit } = require('../middleware/auth');

// Helper function to transform order to invoice format
const transformOrderToInvoice = (order) => {
  // Map payment status to invoice status
  let invoiceStatus = 'pending';
  if (order.payment_status === 'paid' && order.payment_receipt?.verified) {
    invoiceStatus = 'paid';
  } else if (order.payment_receipt?.filename && !order.payment_receipt?.verified) {
    invoiceStatus = 'pending'; // Payment uploaded but not verified
  } else if (order.payment_status === 'pending') {
    // Check if overdue (assuming 30 days payment term)
    const dueDate = new Date(order.orderDate);
    dueDate.setDate(dueDate.getDate() + 30);
    if (new Date() > dueDate) {
      invoiceStatus = 'overdue';
    } else {
      invoiceStatus = 'pending';
    }
  }

  return {
    _id: order._id,
    invoiceId: `INV-${order.orderId}`,
    orderId: order.orderId,
    customer: {
      name: order.customer_name,
      email: order.customer_email
    },
    issueDate: order.orderDate,
    dueDate: (() => {
      const due = new Date(order.orderDate);
      due.setDate(due.getDate() + 30); // 30 days payment term
      return due;
    })(),
    status: invoiceStatus,
    total: order.final_amount || order.total,
    paymentMethod: order.payment_receipt?.verified ? order.payment_method : null,
    paidDate: order.payment_receipt?.verifiedDate || null,
    items: order.items || [],
    notes: order.notes || '',
    payment_receipt: order.payment_receipt
  };
};

// Get invoices from orders (main endpoint for billing page)
router.get('/from-orders', async (req, res) => {
  try {
    const { status } = req.query;
    
    // Base filter for orders that should appear as invoices
    let filter = {
      status: { $in: ['Confirmed', 'In_Production', 'Quality_Check', 'Ready_for_Pickup', 'Ready_for_Delivery', 'Out_for_Delivery', 'Delivered', 'Completed'] }
    };

    // If status filter is provided, add payment-related filters
    if (status === 'paid') {
      filter.payment_status = 'paid';
      filter['payment_receipt.verified'] = true;
    } else if (status === 'pending') {
      filter.$or = [
        { payment_status: 'pending' },
        { payment_status: 'partial', 'payment_receipt.verified': { $ne: true } }
      ];
    } else if (status === 'overdue') {
      // Orders older than 30 days with pending payment
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 30);
      filter.orderDate = { $lt: overdueDate };
      filter.payment_status = { $ne: 'paid' };
    }

    const orders = await Order.find(filter).sort({ orderDate: -1 });
    const invoices = orders.map(transformOrderToInvoice);
    
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices from orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get billing summary from orders
router.get('/reports/summary', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Confirmed', 'In_Production', 'Quality_Check', 'Ready_for_Pickup', 'Ready_for_Delivery', 'Out_for_Delivery', 'Delivered', 'Completed'] }
    });

    const invoices = orders.map(transformOrderToInvoice);
    
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
      pendingAmount: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + (inv.total || 0), 0),
      overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0)
    };

    res.json(summary);
  } catch (err) {
    console.error('Error fetching billing summary:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.invoiceId = 'INV-' + Date.now();

    const billing = new Billing(data);
    await billing.save();

    res.status(201).json({ billing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all invoices - temporarily removing auth for development
router.get('/', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const invoices = await Billing.find(filter).sort({ issueDate: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Billing.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const updatedInvoice = await Billing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark invoice as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const { paymentMethod, paidDate } = req.body;
    const updateData = { 
      status: 'Paid',
      paymentMethod,
      paidDate: paidDate || new Date()
    };

    const updatedInvoice = await Billing.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedInvoice = await Billing.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(updatedInvoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const deletedInvoice = await Billing.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get billing summary/reports
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.issueDate = {};
      if (startDate) dateFilter.issueDate.$gte = new Date(startDate);
      if (endDate) dateFilter.issueDate.$lte = new Date(endDate);
    }

    const summary = await Billing.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$total' },
          paidAmount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'Paid'] }, '$total', 0] 
            } 
          },
          pendingAmount: { 
            $sum: { 
              $cond: [{ $ne: ['$status', 'Paid'] }, '$total', 0] 
            } 
          }
        }
      }
    ]);

    res.json(summary[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
