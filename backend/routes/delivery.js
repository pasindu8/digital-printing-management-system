const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const { authRequired, permit } = require('../middleware/auth');

console.log('🚀 Delivery routes module loaded!');

// Helper function to parse customer address string
function parseCustomerAddress(addressString) {
  if (!addressString) return { street: '', city: '', state: '', zipCode: '' };
  
  // Split by comma and clean up
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // Assume format: "Street, City, State ZIP" or "Street, City, State, ZIP, Country"
    const street = parts[0] || '';
    const city = parts[1] || '';
    
    // Try to extract state and zip from the remaining parts
    let state = '';
    let zipCode = '';
    
    if (parts.length >= 3) {
      const stateZipPart = parts[2];
      // Check if it contains digits (likely ZIP)
      const zipMatch = stateZipPart.match(/\d+/);
      if (zipMatch) {
        zipCode = zipMatch[0];
        state = stateZipPart.replace(/\d+/g, '').trim();
      } else {
        state = stateZipPart;
        // Check next part for ZIP
        if (parts.length >= 4) {
          const nextPart = parts[3];
          const nextZipMatch = nextPart.match(/\d+/);
          if (nextZipMatch) {
            zipCode = nextZipMatch[0];
          }
        }
      }
    }
    
    return { street, city, state, zipCode };
  }
  
  // Fallback: use the whole string as street
  return { street: addressString, city: '', state: '', zipCode: '' };
}

// Create delivery with enhanced features
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.deliveryId = 'DEL-' + Date.now();
    data.trackingNumber = 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Add initial tracking entry
    data.tracking_updates = [{
      status: 'Scheduled',
      timestamp: new Date(),
      location: 'Warehouse',
      notes: 'Delivery scheduled'
    }];

    const delivery = new Delivery(data);
    await delivery.save();

    res.status(201).json({ delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all deliveries (with role-based filtering)
router.get('/', authRequired, async (req, res) => {
  try {
    console.log('🔍 Delivery route hit - User:', req.user?.email, 'Role:', req.user?.role);
    let deliveries;
    
    // If user is a customer, redirect to customer-specific endpoint
    if (req.user.role === 'Customer') {
      console.log('👤 Customer detected, filtering deliveries...');
      // For customers, only show their own deliveries
      const userId = req.user._id || req.user.id;
      const userEmail = req.user.email;
      
      console.log('🔍 Looking for deliveries with email:', userEmail, 'or userId:', userId);
      
      deliveries = await Delivery.find({ 
        $or: [
          { 'customer.email': userEmail },
          { 'customer.customerId': userId }
        ]
      })
      .populate('orderId')
      .populate('assignedTo', 'name email')
      .sort({ scheduledDate: -1 });

      console.log(`📦 Found ${deliveries.length} deliveries for customer`);

      // If no deliveries found, try to find via Customer model
      if (deliveries.length === 0) {
        console.log('🔍 No deliveries found by email/userId, checking Customer model...');
        const Customer = require('../models/Customer');
        const customerRecord = await Customer.findOne({ 
          $or: [
            { email: userEmail },
            { _id: userId }
          ]
        });

        if (customerRecord) {
          console.log('👤 Found customer record:', customerRecord.email);
          deliveries = await Delivery.find({
            $or: [
              { 'customer.customerId': customerRecord._id },
              { 'customer.email': customerRecord.email }
            ]
          })
          .populate('orderId')
          .populate('assignedTo', 'name email')
          .sort({ scheduledDate: -1 });
          
          console.log(`📦 Found ${deliveries.length} deliveries via Customer model`);
        } else {
          console.log('❌ No customer record found');
        }
      }
    } else {
      console.log('👨‍💼 Admin/Staff user detected, showing all deliveries...');
      // For admin/staff roles, show all deliveries
      deliveries = await Delivery.find()
        .populate('orderId')
        .populate('assignedTo', 'name email')
        .sort({ scheduledDate: -1 });
        
      console.log(`📦 Found ${deliveries.length} total deliveries`);
    }
    
    res.json(deliveries);
  } catch (err) {
    console.error('❌ Error fetching deliveries:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get deliveries for a specific customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ 
      'customer.customerId': req.params.customerId 
    })
    .populate('orderId')
    .populate('assignedTo', 'name email')
    .sort({ scheduledDate: -1 });
    
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get deliveries for current customer (using auth middleware)
router.get('/my-deliveries', authRequired, async (req, res) => {
  try {
    // Ensure only customers can access this endpoint
    if (req.user.role !== 'Customer') {
      return res.status(403).json({ message: 'Access denied. Customers only.' });
    }

    // Get user information from authenticated user
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find deliveries that belong to this customer by multiple criteria
    const deliveries = await Delivery.find({ 
      $or: [
        // Match by customer email (most reliable for customer accounts)
        { 'customer.email': userEmail },
        // Match by user ID if customer.customerId references the User model
        { 'customer.customerId': userId },
        // Also check if there's a Customer document linked to this user
        // This will be handled by searching customer records first
      ]
    })
    .populate('orderId')
    .populate('assignedTo', 'name email')
    .sort({ scheduledDate: -1 });

    // If no deliveries found by email/ID, try to find via Customer model
    if (deliveries.length === 0) {
      const Customer = require('../models/Customer');
      const customerRecord = await Customer.findOne({ 
        $or: [
          { email: userEmail },
          { _id: userId }
        ]
      });

      if (customerRecord) {
        const customerDeliveries = await Delivery.find({
          $or: [
            { 'customer.customerId': customerRecord._id },
            { 'customer.email': customerRecord.email }
          ]
        })
        .populate('orderId')
        .populate('assignedTo', 'name email')
        .sort({ scheduledDate: -1 });
        
        return res.json(customerDeliveries);
      }
    }
    
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching customer deliveries:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get deliveries assigned to delivery person
router.get('/assigned/:userId', async (req, res) => {
  try {
    const deliveries = await Delivery.find({ 
      assignedTo: req.params.userId,
      status: { $in: ['Scheduled', 'In_Transit', 'Out_for_Delivery'] }
    })
    .populate('orderId')
    .sort({ scheduledDate: 1 });
    
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update delivery status with tracking
router.put('/:id/status', async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Add tracking update
    const trackingUpdate = {
      status,
      timestamp: new Date(),
      location: location || 'Unknown',
      notes: notes || `Status updated to ${status}`
    };

    delivery.tracking_updates.push(trackingUpdate);
    delivery.status = status;
    
    if (status === 'Delivered') {
      delivery.deliveredDate = new Date();
      delivery.actualDeliveryTime = new Date();
    }

    await delivery.save();

    // Update related order status
    if (delivery.orderId) {
      await Order.findByIdAndUpdate(delivery.orderId, { 
        status: status === 'Delivered' ? 'Delivered' : 'Out_for_Delivery'
      });
    }

    res.json({ message: 'Delivery status updated', delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate delivery report for delivery person
router.get('/reports/delivery-person/:userId', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter = {};
    
    if (start_date || end_date) {
      dateFilter.scheduledDate = {};
      if (start_date) dateFilter.scheduledDate.$gte = new Date(start_date);
      if (end_date) dateFilter.scheduledDate.$lte = new Date(end_date);
    }

    const deliveries = await Delivery.find({
      assignedTo: req.params.userId,
      ...dateFilter
    }).populate('orderId');

    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'Delivered').length;
    const totalDistance = deliveries.reduce((sum, d) => sum + (d.route?.distance || 0), 0);

    res.json({
      totalDeliveries,
      completedDeliveries,
      pendingDeliveries: totalDeliveries - completedDeliveries,
      totalDistance,
      deliveries: deliveries.map(d => ({
        deliveryId: d.deliveryId,
        customer: d.customer.name,
        status: d.status,
        scheduledDate: d.scheduledDate,
        deliveredDate: d.deliveredDate,
        distance: d.route?.distance
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get delivery calendar view for scheduling
router.get('/calendar', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter = {};
    
    if (start_date || end_date) {
      dateFilter.scheduledDate = {};
      if (start_date) dateFilter.scheduledDate.$gte = new Date(start_date);
      if (end_date) dateFilter.scheduledDate.$lte = new Date(end_date);
    }

    const deliveries = await Delivery.find(dateFilter)
      .populate('assignedTo')
      .populate('orderId')
      .sort({ scheduledDate: 1 });

    // Group by date for calendar view
    const calendarData = deliveries.reduce((acc, delivery) => {
      const date = delivery.scheduledDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        deliveryId: delivery.deliveryId,
        customer: delivery.customer.name,
        address: delivery.customer.address,
        status: delivery.status,
        assignedTo: delivery.assignedTo,
        estimatedTime: delivery.estimatedTime
      });
      return acc;
    }, {});

    res.json(calendarData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all deliveries with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { status, date, assigned_to } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (assigned_to) filter.assignedTo = assigned_to;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const deliveries = await Delivery.find(filter).sort({ scheduledDate: 1 });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simple test route
router.get('/orders/test', (req, res) => {
  res.json({ message: 'Orders test route works!' });
});

// Get orders ready for pickup/delivery
router.get('/orders/ready-for-pickup', authRequired, async (req, res) => {
  try {
    console.log('🔍 Ready for pickup endpoint hit!');
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

// Complete order (mark as delivered/completed)
router.put('/orders/complete/:orderId', authRequired, async (req, res) => {
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

// Get delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get delivery by tracking number
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update delivery
router.put('/:id', async (req, res) => {
  try {
    const updatedDelivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(updatedDelivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    
    if (status === 'Delivered') {
      updateData.deliveredDate = new Date();
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(updatedDelivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete delivery
router.delete('/:id', async (req, res) => {
  try {
    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!deletedDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get orders ready for pickup and manage delivery scheduling
router.get('/ready-for-pickup', authRequired, async (req, res) => {
  try {
    console.log('🚚 Fetching orders ready for pickup...');
    
    // Find orders with status 'Ready_for_Pickup'
    const readyOrders = await Order.find({ 
      status: 'Ready_for_Pickup' 
    })
    .populate('customer_id')
    .populate('assigned_to')
    .sort({ orderDate: -1 });

    console.log(`📦 Found ${readyOrders.length} orders ready for pickup`);

    // For each order, check if delivery record exists
    const ordersWithDeliveryStatus = await Promise.all(
      readyOrders.map(async (order) => {
        const existingDelivery = await Delivery.findOne({ orderId: order._id });
        
        return {
          ...order.toObject(),
          deliveryStatus: existingDelivery ? existingDelivery.status : 'Not Scheduled',
          deliveryId: existingDelivery ? existingDelivery.deliveryId : null,
          scheduledDate: existingDelivery ? existingDelivery.scheduledDate : null,
          driverName: existingDelivery ? existingDelivery.driverName : null
        };
      })
    );

    res.json(ordersWithDeliveryStatus);
  } catch (err) {
    console.error('❌ Error fetching ready orders:', err);
    res.status(500).json({ message: 'Error fetching orders ready for pickup', error: err.message });
  }
});

// Schedule delivery for an order
router.post('/schedule', authRequired, async (req, res) => {
  try {
    const { 
      orderId, 
      driverName, 
      scheduledDate, 
      estimatedTime,
      deliveryNotes 
    } = req.body;

    console.log('📅 Scheduling delivery for order:', orderId);

    // Find the order
    const order = await Order.findById(orderId).populate('customer_id');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if delivery already exists
    let delivery = await Delivery.findOne({ orderId: orderId });
    
    if (delivery) {
      // Update existing delivery
      delivery.driverName = driverName;
      delivery.scheduledDate = new Date(scheduledDate);
      delivery.estimatedTime = estimatedTime;
      delivery.deliveryNotes = deliveryNotes;
      delivery.status = 'Scheduled';
      await delivery.save();
    } else {
      // Create new delivery record
      const deliveryData = {
        deliveryId: 'DEL-' + Date.now(),
        orderId: order._id,
        customer: {
          customerId: order.customer_id?._id,
          name: order.customer_name,
          address: (() => {
            // Use delivery_address if available, otherwise parse customer_address
            if (order.delivery_address && order.delivery_address.street) {
              return {
                street: order.delivery_address.street,
                city: order.delivery_address.city || '',
                state: '', // Not available in current Order schema
                zipCode: '' // Not available in current Order schema
              };
            } else if (order.customer_address) {
              // Parse the customer_address string
              return parseCustomerAddress(order.customer_address);
            } else {
              return { street: 'Address not provided', city: '', state: '', zipCode: '' };
            }
          })(),
          phone: order.customer_phone,
          email: order.customer_email
        },
        items: order.items.map(item => ({
          orderId: order.orderId,
          product: item.product,
          quantity: item.quantity,
          specialInstructions: item.specifications
        })),
        driverName: driverName,
        scheduledDate: new Date(scheduledDate),
        estimatedTime: estimatedTime,
        deliveryNotes: deliveryNotes,
        status: 'Scheduled',
        trackingNumber: 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase()
      };

      delivery = new Delivery(deliveryData);
      await delivery.save();
    }

    // Update order status to 'Scheduled' or keep as Ready_for_Pickup based on requirement
    // For now, we'll update it to show it's been scheduled
    await Order.findByIdAndUpdate(orderId, { 
      status: 'Ready_for_Delivery',
      delivery_notes: deliveryNotes 
    });

    console.log('✅ Delivery scheduled successfully:', delivery.deliveryId);

    res.json({ 
      message: 'Delivery scheduled successfully', 
      delivery: delivery,
      updatedOrderStatus: 'Ready_for_Delivery'
    });
  } catch (err) {
    console.error('❌ Error scheduling delivery:', err);
    res.status(500).json({ message: 'Error scheduling delivery', error: err.message });
  }
});

module.exports = router;
