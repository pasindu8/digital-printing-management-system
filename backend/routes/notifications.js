const express = require('express');
const router = express.Router();

// Import only the models we know exist
let Order, RawMaterial, MaterialOrder, Delivery, Employee, Attendance, Expense, Billing, Customer;

try {
  Order = require('../models/Order');
} catch (err) {
  console.log('Order model not available');
}

try {
  RawMaterial = require('../models/Raw_materials');
} catch (err) {
  console.log('RawMaterial model not available');
}

try {
  MaterialOrder = require('../models/Material_orders');
} catch (err) {
  console.log('MaterialOrder model not available');
}

try {
  Delivery = require('../models/Delivery');
} catch (err) {
  console.log('Delivery model not available');
}

try {
  const HR = require('../models/HR');
  Employee = HR.Employee;
  Attendance = HR.Attendance;
} catch (err) {
  console.log('HR models not available');
}

try {
  const Finance = require('../models/Finance');
  Expense = Finance.Expense;
} catch (err) {
  console.log('Finance models not available');
}

try {
  Billing = require('../models/Billing');
} catch (err) {
  console.log('Billing model not available');
}

try {
  Customer = require('../models/Customer');
} catch (err) {
  console.log('Customer model not available');
}

// Get real-time notifications endpoint
router.get('/notifications', async (req, res) => {
  try {
    const notifications = [];
    const currentDate = new Date();

    // Safely fetch data with error handling
    let orders = [];
    let rawMaterials = [];
    let materialOrders = [];
    let deliveries = [];
    let employees = [];
    let expenses = [];
    let invoices = [];
    let attendance = [];
    let customers = [];

    try {
      orders = await Order.find().lean();
    } catch (err) {
      console.log('Error fetching orders:', err.message);
    }

    try {
      rawMaterials = await RawMaterial.find().lean();
    } catch (err) {
      console.log('Error fetching raw materials:', err.message);
    }

    try {
      materialOrders = await MaterialOrder.find().lean();
    } catch (err) {
      console.log('Error fetching material orders:', err.message);
    }

    try {
      if (Delivery) {
        deliveries = await Delivery.find().lean();
      }
    } catch (err) {
      console.log('Error fetching deliveries:', err.message);
    }

    try {
      if (Employee) {
        employees = await Employee.find().lean();
      }
    } catch (err) {
      console.log('Error fetching employees:', err.message);
    }

    try {
      if (Expense) {
        expenses = await Expense.find().lean();
      }
    } catch (err) {
      console.log('Error fetching expenses:', err.message);
    }

    try {
      if (Billing) {
        invoices = await Billing.find().lean();
      }
    } catch (err) {
      console.log('Error fetching invoices:', err.message);
    }

    try {
      if (Attendance) {
        attendance = await Attendance.find().lean();
      }
    } catch (err) {
      console.log('Error fetching attendance:', err.message);
    }

    try {
      if (Customer) {
        customers = await Customer.find().lean();
      }
    } catch (err) {
      console.log('Error fetching customers:', err.message);
    }

    // 1. Critical Inventory Alerts
    const lowStockItems = rawMaterials.filter(material => 
      (material.current_stock || 0) <= (material.minimum_stock_level || 0)
    );

    lowStockItems.forEach(item => {
      notifications.push({
        id: `inventory-${item.material_id || item._id}`,
        type: 'inventory',
        priority: item.current_stock === 0 ? 'critical' : 'warning',
        title: item.current_stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `${item.material_name}: ${item.current_stock} units remaining (min: ${item.minimum_stock_level})`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Order Now',
        icon: 'package-x'
      });
    });

    // 2. Order Management Alerts
    const pendingOrders = orders.filter(order => 
      order.status === 'Pending' || order.status === 'pending'
    );
    
    const overdueOrders = orders.filter(order => {
      const expectedDate = new Date(order.expected_completion_date || order.delivery_date);
      return expectedDate < currentDate && order.status !== 'Completed';
    });

    if (pendingOrders.length > 5) {
      notifications.push({
        id: 'orders-pending',
        type: 'orders',
        priority: pendingOrders.length > 10 ? 'critical' : 'warning',
        title: 'Pending Orders Alert',
        message: `${pendingOrders.length} orders awaiting processing`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Review Orders',
        icon: 'clipboard-list'
      });
    }

    if (overdueOrders.length > 0) {
      notifications.push({
        id: 'orders-overdue',
        type: 'orders',
        priority: 'critical',
        title: 'Overdue Orders',
        message: `${overdueOrders.length} orders past expected completion date`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Update Status',
        icon: 'clock-alert'
      });
    }

    // 3. Financial Alerts
    const totalRevenue = orders
      .filter(order => order.status === 'Completed')
      .reduce((sum, order) => sum + (order.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    if (profitMargin < 10 && totalRevenue > 0) {
      notifications.push({
        id: 'finance-margin',
        type: 'finance',
        priority: profitMargin < 5 ? 'critical' : 'warning',
        title: 'Low Profit Margin',
        message: `Current profit margin: ${profitMargin.toFixed(1)}%`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Review Costs',
        icon: 'trending-down'
      });
    }

    // Outstanding invoices alert
    const overdueInvoices = invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      return dueDate < currentDate && invoice.status !== 'Paid';
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      notifications.push({
        id: 'finance-overdue',
        type: 'finance',
        priority: 'warning',
        title: 'Overdue Invoices',
        message: `${overdueInvoices.length} invoices overdue (Rs. ${totalOverdue.toFixed(2)})`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Follow Up',
        icon: 'file-text'
      });
    }

    // 4. HR & Attendance Alerts
    const todayAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      return recordDate.toDateString() === today.toDateString() && record.status === 'Present';
    }).length;

    const attendanceRate = employees.length > 0 ? (todayAttendance / employees.length) * 100 : 100;
    
    if (attendanceRate < 85) {
      notifications.push({
        id: 'hr-attendance',
        type: 'hr',
        priority: attendanceRate < 70 ? 'critical' : 'warning',
        title: 'Low Attendance',
        message: `Today's attendance: ${attendanceRate.toFixed(1)}% (${todayAttendance}/${employees.length})`,
        timestamp: currentDate,
        actionRequired: attendanceRate < 70,
        actionText: 'Check Staff',
        icon: 'users'
      });
    }

    // 5. Delivery Alerts
    const todayDeliveries = deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
      return deliveryDate.toDateString() === currentDate.toDateString();
    });

    const overdueDeliveries = deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.scheduledDate || delivery.planned_delivery_date);
      return deliveryDate < currentDate && 
             delivery.status !== 'Delivered' && 
             delivery.status !== 'delivered';
    });

    if (todayDeliveries.length > 0) {
      notifications.push({
        id: 'delivery-today',
        type: 'delivery',
        priority: 'info',
        title: 'Today\'s Deliveries',
        message: `${todayDeliveries.length} deliveries scheduled for today`,
        timestamp: currentDate,
        actionRequired: false,
        actionText: 'View Schedule',
        icon: 'truck'
      });
    }

    if (overdueDeliveries.length > 0) {
      notifications.push({
        id: 'delivery-overdue',
        type: 'delivery',
        priority: 'critical',
        title: 'Overdue Deliveries',
        message: `${overdueDeliveries.length} deliveries past scheduled date`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Reschedule',
        icon: 'truck-x'
      });
    }

    // 6. Material Order Alerts
    const overdueMaterialOrders = materialOrders.filter(order => {
      const expectedDate = new Date(order.delivery_date);
      return expectedDate < currentDate && order.status !== 'Delivered';
    });

    if (overdueMaterialOrders.length > 0) {
      notifications.push({
        id: 'materials-overdue',
        type: 'materials',
        priority: 'warning',
        title: 'Overdue Material Orders',
        message: `${overdueMaterialOrders.length} material deliveries are overdue`,
        timestamp: currentDate,
        actionRequired: true,
        actionText: 'Contact Suppliers',
        icon: 'package-check'
      });
    }

    // 7. Customer Growth Alerts
    const recentCustomers = customers.filter(customer => {
      const createdDate = new Date(customer.createdAt || customer.dateJoined);
      const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return createdDate > weekAgo;
    });

    if (recentCustomers.length > 5) {
      notifications.push({
        id: 'customers-new',
        type: 'customers',
        priority: 'info',
        title: 'New Customer Growth',
        message: `${recentCustomers.length} new customers this week`,
        timestamp: currentDate,
        actionRequired: false,
        actionText: 'Welcome Them',
        icon: 'user-plus'
      });
    }

    // Sort by priority and timestamp
    const sortedNotifications = notifications
      .sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10); // Limit to 10 most important notifications

    res.json({
      success: true,
      notifications: sortedNotifications,
      summary: {
        total: sortedNotifications.length,
        critical: sortedNotifications.filter(n => n.priority === 'critical').length,
        warning: sortedNotifications.filter(n => n.priority === 'warning').length,
        info: sortedNotifications.filter(n => n.priority === 'info').length
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    // In a real implementation, you'd save read status to database
    // For now, just return success
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

module.exports = router;