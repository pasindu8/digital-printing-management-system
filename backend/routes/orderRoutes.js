const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const RawMaterial = require('../models/Raw_materials');
const { authRequired, permit } = require('../middleware/auth');
const { sendEmail, generateInvoiceEmail, generateRejectionEmail } = require('../utils/emailService');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');

// Multer configuration for receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueName = `receipt_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only images and PDFs
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Material mapping for automatic material usage tracking
const materialToRawMaterialMapping = {
  'Standard Paper (80gsm)': 'A4 Premium White Paper',
  'Premium Paper (120gsm)': 'A4 Premium White Paper',
  'Cardstock (250gsm)': 'Cardstock 300gsm White',
  'Glossy Paper': 'A3 Photo Paper Glossy',
  'Matte Paper': 'A4 Premium White Paper',
  'Recycled Paper': 'A4 Premium White Paper',
  'Vinyl': 'Vinyl Banner Material',
  'Fabric': 'Vinyl Banner Material',
  'Canvas': 'Vinyl Banner Material'
};

// Calculate material usage based on order specifications
const calculateMaterialUsage = (orderItem) => {
  const materialUsage = [];
  const specs = typeof orderItem.specifications === 'string' ? 
    JSON.parse(orderItem.specifications) : orderItem.specifications;
  
  // Calculate paper/material usage
  const rawMaterialName = materialToRawMaterialMapping[specs.material];
  if (rawMaterialName) {
    let quantity = orderItem.quantity;
    
    // Adjust quantity based on product type and size
    if (specs.size && specs.size.includes('A3')) {
      quantity *= 2; // A3 uses more material than A4
    }
    if (orderItem.product === 'Banners' || orderItem.product === 'Posters') {
      quantity *= 0.5; // Different measurement unit (meters vs sheets)
    }
    
    materialUsage.push({
      material_name: rawMaterialName,
      quantity_used: Math.ceil(quantity * 1.1), // Add 10% waste factor
      unit: rawMaterialName.includes('Banner') || rawMaterialName.includes('Vinyl') ? 'meters' : 'sheets'
    });
  }
  
  // Add ink usage
  if (specs.coloring !== 'Black & White') {
    materialUsage.push({
      material_name: 'Color Ink Set - Canon CLI-571',
      quantity_used: Math.ceil(orderItem.quantity / 100), // 1 set per 100 prints
      unit: 'sets'
    });
  }
  
  // Always add some black ink usage
  materialUsage.push({
    material_name: 'Black Ink Cartridge - HP 950XL',
    quantity_used: Math.ceil(orderItem.quantity / 200), // 1 cartridge per 200 prints
    unit: 'cartridges'
  });
  
  return materialUsage;
};

// Record material usage for an order
const recordMaterialUsageForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.items || order.items.length === 0) {
      return;
    }
    
    for (const item of order.items) {
      const materialUsage = calculateMaterialUsage(item);
      
      for (const usage of materialUsage) {
        const material = await RawMaterial.findOne({ material_name: usage.material_name });
        if (material && material.current_stock >= usage.quantity_used) {
          // Deduct from stock
          material.current_stock -= usage.quantity_used;
          await material.save();
          
          // Record usage in order
          if (!item.raw_materials_used) {
            item.raw_materials_used = [];
          }
          item.raw_materials_used.push({
            material_id: material._id,
            material_name: material.material_name,
            quantity_used: usage.quantity_used,
            unit: usage.unit
          });
        }
      }
    }
    
    await order.save();
  } catch (error) {
    console.error('Error recording material usage:', error);
  }
};

// Restore materials when order is canceled
const restoreMaterialsForOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order || !order.items || order.items.length === 0) {
      return;
    }
    
    for (const item of order.items) {
      if (item.raw_materials_used && item.raw_materials_used.length > 0) {
        for (const usage of item.raw_materials_used) {
          const material = await RawMaterial.findById(usage.material_id);
          if (material) {
            // Restore stock
            material.current_stock += usage.quantity_used;
            await material.save();
            console.log(`Restored ${usage.quantity_used} ${usage.unit} of ${usage.material_name} to inventory`);
          }
        }
        // Clear the material usage records
        item.raw_materials_used = [];
      }
    }
    
    await order.save();
    console.log(`Materials restored for canceled order: ${order.orderId}`);
  } catch (error) {
    console.error('Error restoring materials:', error);
  }
};

// Create order with enhanced features
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.orderId = 'ORD-' + Date.now();
    
    // Add tracking entry for new order
    data.tracking_history = [{
      status: 'New',
      timestamp: new Date(),
      notes: 'Order created'
    }];

    const order = new Order(data);
    await order.save();

    // Record material usage after order creation
    await recordMaterialUsageForOrder(order._id);

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all orders with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { status, customer, customerEmail, date_from, date_to, priority, has_receipt, verified } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (customer) filter.customer_name = { $regex: customer, $options: 'i' };
    if (customerEmail) filter.customer_email = customerEmail;
    if (priority) filter.priority = priority;
    
    // Filter for orders with receipts
    if (has_receipt === 'true') {
      filter['payment_receipt.filename'] = { $exists: true, $ne: null };
    }
    
    // Filter by verification status
    if (verified === 'true') {
      filter['payment_receipt.verified'] = true;
    } else if (verified === 'false') {
      filter['payment_receipt.verified'] = { $ne: true };
    }
    
    if (date_from || date_to) {
      filter.orderDate = {};
      if (date_from) filter.orderDate.$gte = new Date(date_from);
      if (date_to) filter.orderDate.$lte = new Date(date_to);
    }

    const orders = await Order.find(filter)
      .populate('customer_id')
      .populate('assigned_to')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders ready for pickup/delivery - MUST come before /:id route
router.get('/ready-for-pickup', authRequired, async (req, res) => {
  try {
    console.log('🔍 Fetching orders ready for pickup/delivery...');
    
    // Find orders with status 'Ready_for_Pickup' or 'Ready_for_Delivery'
    const readyOrders = await Order.find({ 
      status: { $in: ['Ready_for_Pickup', 'Ready_for_Delivery'] }
    })
    .populate('customer_id', 'name email phone address')
    .populate('assigned_employee.employeeId')
    .sort({ 
      expected_completion_date: 1,  // Orders due sooner first
      orderDate: 1  // Then by order date
    });

    console.log(`📦 Found ${readyOrders.length} orders ready for pickup/delivery`);
    
    // Transform the data to match the delivery interface format
    const transformedOrders = readyOrders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      deliveryId: `PICKUP-${order.orderId}`,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address,
        customerId: order.customer_id
      },
      items: order.items?.map(item => ({
        product: item.product,
        quantity: item.quantity,
        specifications: item.specifications
      })) || [],
      status: order.status,
      orderStatus: order.status,  // Keep original status
      total: order.final_amount || order.total,
      payment_status: order.payment_status,
      scheduledDate: order.expected_completion_date || order.delivery_date,
      priority: order.priority,
      notes: order.notes,
      special_instructions: order.special_instructions,
      assignedEmployee: order.assigned_employee,
      tracking_history: order.tracking_history,
      createdAt: order.orderDate,
      updatedAt: order.updatedAt
    }));

    res.json(transformedOrders);
  } catch (err) {
    console.error('❌ Error fetching ready orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get customer statistics for dashboard
router.get('/customer-stats', async (req, res) => {
  try {
    // Count active orders (orders that are not completed, delivered, or cancelled)
    const activeOrdersCount = await Order.countDocuments({
      status: { 
        $nin: ['Completed', 'Delivered', 'Cancelled'] 
      }
    });

    // Calculate total revenue from completed and delivered orders
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          status: { $in: ['Completed', 'Delivered'] },
          final_amount: { $exists: true, $ne: null }
        }
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$final_amount' } 
        } 
      }
    ]);

    // Count total customers (users with Customer role)
    const totalCustomersCount = await Order.distinct('customer_email').then(emails => emails.length);

    const stats = {
      activeOrders: activeOrdersCount,
      totalRevenue: revenueData[0]?.totalRevenue || 0,
      totalCustomers: totalCustomersCount
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching customer stats:', err);
    res.status(500).json({ message: 'Error fetching customer statistics', error: err.message });
  }
});

// Get order by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer_id')
      .populate('assigned_to');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order with tracking
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    const newStatus = updates.status;

    // If status is being updated, add tracking entry
    if (newStatus && newStatus !== oldStatus) {
      const trackingEntry = {
        status: newStatus,
        timestamp: new Date(),
        notes: updates.tracking_notes || `Status updated to ${newStatus}`
      };
      
      if (!order.tracking_history) {
        order.tracking_history = [];
      }
      order.tracking_history.push(trackingEntry);

      // Handle material restoration for canceled orders
      if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
        await restoreMaterialsForOrder(order._id);
        console.log(`Order ${order.orderId} canceled - materials restored to inventory`);
      }
      
      // Handle material deduction if order is being processed for the first time
      if (oldStatus === 'New' && newStatus !== 'New' && newStatus !== 'Cancelled') {
        // Only deduct materials if not already done
        const hasExistingMaterialUsage = order.items.some(item => 
          item.raw_materials_used && item.raw_materials_used.length > 0
        );
        if (!hasExistingMaterialUsage) {
          await recordMaterialUsageForOrder(order._id);
          console.log(`Order ${order.orderId} processing started - materials deducted from inventory`);
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { ...updates, tracking_history: order.tracking_history }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create quotation
router.post('/:id/quotation', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const quotationData = {
      quotation_id: 'QUO-' + Date.now(),
      ...req.body,
      status: 'pending'
    };

    order.quotation = quotationData;
    order.status = 'Quote_Sent';
    await order.save();

    res.json({ message: 'Quotation created', quotation: quotationData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get order tracking for customer
router.get('/:id/tracking', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      orderId: order.orderId,
      status: order.status,
      tracking_history: order.tracking_history,
      estimated_completion: order.expected_completion_date,
      delivery_type: order.delivery_type
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload payment receipt
router.post('/:id/payment-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { orderId, customerId, paymentDetails } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt file uploaded' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Parse payment details if provided
    let parsedPaymentDetails = null;
    if (paymentDetails) {
      try {
        parsedPaymentDetails = JSON.parse(paymentDetails);
      } catch (error) {
        console.error('Error parsing payment details:', error);
      }
    }

    // Update order with payment receipt information
    order.payment_receipt = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date(),
      uploadedBy: customerId, // Customer ID
      verified: false,
      // Store payment details provided by customer
      paymentDetails: parsedPaymentDetails ? {
        bank: parsedPaymentDetails.bank,
        depositedAmount: parseFloat(parsedPaymentDetails.depositedAmount) || 0,
        branch: parsedPaymentDetails.branch,
        paymentDate: parsedPaymentDetails.paymentDate
      } : null
    };

    // Update payment status to indicate receipt uploaded
    order.payment_status = 'partial'; // Indicates receipt uploaded but not verified

    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    const trackingNote = parsedPaymentDetails 
      ? `Payment receipt uploaded: ${req.file.originalname} (${parsedPaymentDetails.bank} - ${parsedPaymentDetails.branch})`
      : `Payment receipt uploaded: ${req.file.originalname}`;
    
    order.tracking_history.push({
      status: 'Payment Receipt Uploaded',
      timestamp: new Date(),
      notes: trackingNote
    });

    await order.save();

    res.json({ 
      message: 'Payment receipt uploaded successfully',
      receipt: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadDate: order.payment_receipt.uploadDate,
        paymentDetails: order.payment_receipt.paymentDetails
      }
    });
  } catch (err) {
    console.error('Error uploading payment receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

// Approve payment receipt
router.post('/:id/approve-receipt', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.payment_receipt || !order.payment_receipt.filename) {
      return res.status(400).json({ message: 'No payment receipt found for this order' });
    }

    // Approve the receipt
    order.payment_receipt.verified = true;
    order.payment_receipt.verifiedDate = new Date();
    order.payment_status = 'paid'; // Update payment status
    order.status = 'Confirmed'; // Change order status to Confirmed when payment is approved

    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    order.tracking_history.push({
      status: 'Payment Verified',
      timestamp: new Date(),
      notes: 'Payment receipt approved by admin'
    });

    // Add another tracking entry for status change
    order.tracking_history.push({
      status: 'Confirmed',
      timestamp: new Date(),
      notes: 'Order confirmed - payment receipt approved'
    });

    await order.save();

    // Generate and send invoice email
    try {
      // Generate invoice PDF
      const customerData = {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address
      };
      
      const invoice = await generateInvoicePDF(order, customerData);
      
      // Create invoice URL for download
      const invoiceUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/orders/${order._id}/invoice/download`;
      
      // Send invoice email to customer
      if (order.customer_email) {
        const emailContent = generateInvoiceEmail(order.customer_name, order, invoiceUrl);
        const emailResult = await sendEmail(
          order.customer_email,
          `Payment Confirmed - Invoice for Order ${order.orderId}`,
          emailContent
        );
        
        console.log('Invoice email sent:', emailResult);
        
        // Store invoice info in order
        order.invoice = {
          filename: invoice.filename,
          filepath: invoice.relativePath,
          generatedDate: new Date(),
          emailSent: emailResult.success,
          emailSentDate: emailResult.success ? new Date() : null
        };
        await order.save();
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError);
      // Don't fail the approval process if email fails
    }

    res.json({ 
      message: 'Payment receipt approved successfully - Order status changed to Confirmed',
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.payment_status,
        verified: order.payment_receipt.verified,
        customerEmail: order.customer_email,
        invoiceGenerated: !!order.invoice
      }
    });
  } catch (err) {
    console.error('Error approving payment receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

// Reject payment receipt
router.post('/:id/reject-receipt', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.payment_receipt || !order.payment_receipt.filename) {
      return res.status(400).json({ message: 'No payment receipt found for this order' });
    }

    // Reject the receipt
    order.payment_receipt.verified = false;
    order.payment_receipt.rejectionReason = reason || 'Receipt rejected by admin';
    order.payment_receipt.rejectedDate = new Date();

    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    order.tracking_history.push({
      status: 'Payment Rejected',
      timestamp: new Date(),
      notes: `Payment receipt rejected: ${reason || 'No reason provided'}`
    });

    await order.save();

    // Send rejection email to customer
    try {
      if (order.customer_email) {
        const emailContent = generateRejectionEmail(order.customer_name, order, reason || 'Receipt rejected by admin');
        const emailResult = await sendEmail(
          order.customer_email,
          `Payment Receipt Review Required - Order ${order.orderId}`,
          emailContent
        );
        
        console.log('Rejection email sent:', emailResult);
        
        // Store email info in order
        order.rejection_email = {
          reason: reason || 'Receipt rejected by admin',
          emailSent: emailResult.success,
          emailSentDate: emailResult.success ? new Date() : null
        };
        await order.save();
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the rejection process if email fails
    }

    res.json({ 
      message: 'Payment receipt rejected successfully',
      order: {
        orderId: order.orderId,
        rejectionReason: order.payment_receipt.rejectionReason,
        customerEmail: order.customer_email,
        emailSent: !!order.rejection_email?.emailSent
      }
    });
  } catch (err) {
    console.error('Error rejecting payment receipt:', err);
    res.status(500).json({ message: err.message });
  }
});

// Download invoice PDF
router.get('/:id/invoice/download', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.invoice || !order.invoice.filename) {
      return res.status(404).json({ message: 'Invoice not found for this order' });
    }

    const invoicePath = path.join(__dirname, '../uploads/invoices', order.invoice.filename);
    
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${order.orderId}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error downloading invoice:', err);
    res.status(500).json({ message: err.message });
  }
});

// Generate order reports
router.get('/reports/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter = {};
    
    if (start_date || end_date) {
      dateFilter.orderDate = {};
      if (start_date) dateFilter.orderDate.$gte = new Date(start_date);
      if (end_date) dateFilter.orderDate.$lte = new Date(end_date);
    }

    const totalOrders = await Order.countDocuments(dateFilter);
    const statusBreakdown = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['Completed', 'Delivered'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$final_amount' } } }
    ]);

    res.json({
      totalOrders,
      statusBreakdown,
      totalRevenue: revenueData[0]?.totalRevenue || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign order to employee
router.post('/:id/assign', async (req, res) => {
  console.log('=== ASSIGNMENT ENDPOINT HIT ===');
  console.log('Order ID:', req.params.id);
  console.log('Request body:', req.body);
  
  try {
    const { employeeId, employeeName, assignedBy } = req.body;
    
    if (!employeeId || !employeeName) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Employee ID and name are required' });
    }
    
    console.log('Attempting assignment...');
    
    // Find the order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Set assignment details
    order.assigned_employee = {
      employeeId,
      employeeName,
      assignedAt: new Date()
    };
    
    // Try to find the user by employeeId and set assigned_to
    try {
      const User = require('../models/User');
      const user = await User.findOne({ userId: employeeId });
      if (user) {
        order.assigned_to = user._id;
      }
    } catch (err) {
      console.log('Could not find user for employeeId:', employeeId);
    }
    
    // Only set assignedBy if it's a valid ObjectId
    if (assignedBy && mongoose.Types.ObjectId.isValid(assignedBy)) {
      order.assigned_employee.assignedBy = assignedBy;
    }
    
    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    // Create tracking entry with proper ObjectId handling
    const trackingEntry = {
      status: order.status, // Use the current order status
      timestamp: new Date(),
      notes: `Order assigned to ${employeeName}`
    };
    
    // Only add updated_by if assignedBy is a valid ObjectId
    if (assignedBy && mongoose.Types.ObjectId.isValid(assignedBy)) {
      trackingEntry.updated_by = assignedBy;
    }
    
    order.tracking_history.push(trackingEntry);
    
    // Save the order
    await order.save();
    
    console.log('Assignment completed successfully');
    
    res.json({ 
      message: 'Order assigned successfully',
      orderId: req.params.id,
      employeeId,
      employeeName,
      assignedAt: order.assigned_employee.assignedAt,
      order: {
        id: order._id,
        orderId: order.orderId,
        customer: order.customer,
        status: order.status,
        assigned_employee: order.assigned_employee
      }
    });
    
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Unassign order from employee
router.post('/:id/unassign', async (req, res) => {
  try {
    const { assignedBy } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousEmployee = order.assigned_employee?.employeeName || 'Unknown';
    
    // Remove assignment
    order.assigned_employee = undefined;

    // Add tracking entry
    const trackingEntry = {
      status: order.status,
      timestamp: new Date(),
      notes: `Order unassigned from ${previousEmployee}`
    };
    
    // Only add updated_by if assignedBy is a valid ObjectId
    if (assignedBy && mongoose.Types.ObjectId.isValid(assignedBy)) {
      trackingEntry.updated_by = assignedBy;
    }
    
    order.tracking_history.push(trackingEntry);

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders assigned to specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { 'assigned_employee.employeeId': req.params.employeeId };
    
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('customer_id')
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all assignments for admin users (new endpoint for admin My Tasks)
router.get('/admin/all-assignments', authRequired, permit('Admin', 'General_Manager', 'Order_Manager'), async (req, res) => {
  try {
    const { status } = req.query;
    // Find all orders that have been assigned to any employee
    let filter = { 
      'assigned_employee.employeeId': { $exists: true, $ne: null, $ne: '' }
    };
    
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('customer_id')
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete order (mark as delivered/completed)
router.put('/complete/:orderId', authRequired, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;
    
    console.log(`📦 Completing order: ${orderId}`);
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status to Completed
    order.status = 'Completed';
    
    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    order.tracking_history.push({
      status: 'Completed',
      timestamp: new Date(),
      notes: notes || 'Order completed via delivery management',
      updated_by: req.user._id
    });

    await order.save();

    console.log(`✅ Order ${order.orderId} marked as completed`);

    res.json({ 
      message: 'Order completed successfully',
      orderId: order.orderId,
      status: order.status
    });
  } catch (err) {
    console.error('❌ Error completing order:', err);
    res.status(500).json({ message: err.message });
  }
});

// Manual material restoration route (for admin purposes)
router.post('/:id/restore-materials', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await restoreMaterialsForOrder(req.params.id);
    res.json({ 
      message: 'Materials restored successfully',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Error restoring materials:', error);
    res.status(500).json({ message: 'Error restoring materials', error: error.message });
  }
});

// Record payment for an order/invoice
router.post('/:id/record-payment', authRequired, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment information
    order.payment_status = 'paid';
    order.paidDate = new Date(paymentDate);
    order.paymentMethod = paymentMethod;
    
    // Add to payment history if it doesn't exist
    if (!order.paymentHistory) {
      order.paymentHistory = [];
    }
    
    order.paymentHistory.push({
      amount: parseFloat(amount),
      method: paymentMethod,
      date: new Date(paymentDate),
      notes: notes || '',
      recordedBy: req.user._id,
      recordedAt: new Date()
    });

    await order.save();

    res.json({ 
      message: 'Payment recorded successfully',
      orderId: order.orderId,
      paymentAmount: amount
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
});

// Send payment reminder for an order/invoice
router.post('/:id/send-reminder', authRequired, async (req, res) => {
  try {
    const { customerEmail, invoiceId, amount, dueDate } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create reminder email content
    const reminderContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        
        <p>Dear ${order.customer_name || 'Customer'},</p>
        
        <p>This is a friendly reminder that your invoice payment is due.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0;">Invoice Details:</h3>
          <p><strong>Invoice ID:</strong> ${invoiceId || order.orderId}</p>
          <p><strong>Amount Due:</strong> Rs. ${amount || order.total_amount || 0}</p>
          <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
        </div>
        
        <p>Please process your payment at your earliest convenience to avoid any late fees.</p>
        
        <p>If you have already made the payment, please disregard this reminder or contact us with your payment details.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        Your Business Team</p>
      </div>
    `;

    // Send email using the email service
    try {
      await sendEmail(
        customerEmail || order.customer_email,
        'Payment Reminder - Invoice Due',
        reminderContent
      );

      // Log the reminder in the order
      if (!order.reminderHistory) {
        order.reminderHistory = [];
      }
      
      order.reminderHistory.push({
        sentTo: customerEmail || order.customer_email,
        sentAt: new Date(),
        sentBy: req.user._id,
        invoiceId: invoiceId || order.orderId,
        amount: amount || order.total_amount
      });

      await order.save();

      res.json({ 
        message: 'Payment reminder sent successfully',
        sentTo: customerEmail || order.customer_email,
        invoiceId: invoiceId || order.orderId
      });
    } catch (emailError) {
      console.error('Error sending reminder email:', emailError);
      res.status(500).json({ 
        message: 'Failed to send reminder email', 
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Error sending reminder', error: error.message });
  }
});

// Record payment for an order (for invoice payment recording)
router.post('/:id/record-payment', authRequired, permit(['admin', 'finance', 'hr']), async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment information
    order.payment_status = 'paid';
    order.payment_method = paymentMethod;
    order.payment_date = paymentDate ? new Date(paymentDate) : new Date();
    order.payment_amount = amount;
    
    // Add to payment history
    if (!order.payment_history) {
      order.payment_history = [];
    }
    
    order.payment_history.push({
      date: order.payment_date,
      amount: amount,
      method: paymentMethod,
      notes: notes || '',
      recorded_by: req.user.email,
      recorded_at: new Date()
    });

    // If there's a payment receipt, mark it as verified
    if (order.payment_receipt) {
      order.payment_receipt.verified = true;
      order.payment_receipt.verified_by = req.user.email;
      order.payment_receipt.verified_at = new Date();
    }

    await order.save();

    res.json({ 
      message: 'Payment recorded successfully',
      order: {
        orderId: order.orderId,
        payment_status: order.payment_status,
        payment_amount: order.payment_amount,
        payment_date: order.payment_date
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
});

// Send payment reminder for an order
router.post('/:id/send-reminder', authRequired, permit(['admin', 'finance', 'hr']), async (req, res) => {
  try {
    const { customerEmail, invoiceId, amount, dueDate } = req.body;
    const order = await Order.findById(req.params.id).populate('customer');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const customer = order.customer;
    const reminderSubject = `Payment Reminder - Invoice ${invoiceId}`;
    const reminderMessage = `
      Dear ${customer.name},
      
      This is a friendly reminder that your payment for Invoice ${invoiceId} is due.
      
      Invoice Details:
      - Invoice ID: ${invoiceId}
      - Amount: Rs. ${amount?.toFixed(2)}
      - Due Date: ${new Date(dueDate).toLocaleDateString()}
      
      Please make your payment as soon as possible to avoid any late fees.
      
      If you have already made the payment, please ignore this reminder.
      
      Thank you for your business!
      
      Best regards,
      ITP Finance Team
    `;

    await sendEmail(
      customerEmail || customer.email,
      reminderSubject,
      reminderMessage
    );

    // Log the reminder in order history
    if (!order.reminder_history) {
      order.reminder_history = [];
    }
    
    order.reminder_history.push({
      date: new Date(),
      type: 'payment_reminder',
      sent_to: customerEmail || customer.email,
      sent_by: req.user.email,
      invoice_id: invoiceId
    });

    await order.save();

    res.json({ 
      message: 'Payment reminder sent successfully',
      sent_to: customerEmail || customer.email
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({ message: 'Error sending payment reminder', error: error.message });
  }
});

// Get order tracking information
router.get('/:id/tracking', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer_id')
      .populate('assigned_employee', 'name employeeId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Return tracking information
    const trackingInfo = {
      orderId: order.orderId,
      status: order.status,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total: order.total,
      assigned_employee: order.assigned_employee,
      tracking_history: order.tracking_history || [],
      items: order.items,
      notes: order.notes,
      payment_status: order.payment_status
    };

    res.json(trackingInfo);
  } catch (error) {
    console.error('Error fetching tracking information:', error);
    res.status(500).json({ message: 'Error fetching tracking information', error: error.message });
  }
});

// Cancel an order
router.post('/:id/cancel', async (req, res) => {
  try {
    const { cancelledBy, reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status === 'Delivered' || order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({ 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    const oldStatus = order.status;
    
    // Update order status to cancelled
    order.status = 'Cancelled';
    order.cancelled_date = new Date();
    order.cancelled_by = cancelledBy;
    order.cancellation_reason = reason;

    // Add tracking entry
    if (!order.tracking_history) {
      order.tracking_history = [];
    }
    
    order.tracking_history.push({
      status: 'Cancelled',
      timestamp: new Date(),
      notes: `Order cancelled by customer. Reason: ${reason || 'No reason provided'}`,
      updated_by: cancelledBy
    });

    // Restore materials to inventory if order was in production
    if (oldStatus !== 'Pending' && oldStatus !== 'New') {
      await restoreMaterialsForOrder(order._id);
      console.log(`Order ${order.orderId} cancelled - materials restored to inventory`);
    }

    await order.save();

    res.json({ 
      message: 'Order cancelled successfully',
      order: {
        orderId: order.orderId,
        status: order.status,
        cancelled_date: order.cancelled_date
      }
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
});

module.exports = router;
