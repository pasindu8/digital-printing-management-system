const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Billing = require('../models/Billing');
const Customer = require('../models/Customer');
const Production = require('../models/Production');
const Raw_materials = require('../models/Raw_materials');
const Delivery = require('../models/Delivery');
const HR = require('../models/HR');
const User = require('../models/User');

// Safely get or require MaterialOrder model
let MaterialOrder;
try {
  MaterialOrder = mongoose.model('MaterialOrder');
} catch (error) {
  try {
    MaterialOrder = require('../models/Material_orders_new');
  } catch (e) {
    MaterialOrder = require('../models/Material_orders');
  }
}

// Helper function to get date filter
const getDateFilter = (startDate, endDate) => {
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }
  return dateFilter;
};

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Reports routes are working!' });
});

// Comprehensive dashboard overview
router.get('/dashboard-overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Revenue and Financial Metrics
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, payment_status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          totalPaidOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total_amount' }
        }
      }
    ]);

    // Orders Overview
    const ordersOverview = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total_amount' }
        }
      }
    ]);

    // Customer Metrics
    const customerMetrics = await Customer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 }
        }
      }
    ]);

    // Production Metrics
    const productionMetrics = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTime: { $sum: '$actualTime' }
        }
      }
    ]);

    // Inventory Status
    const inventoryStatus = await Raw_materials.aggregate([
      {
        $group: {
          _id: null,
          totalMaterials: { $sum: 1 },
          lowStock: {
            $sum: {
              $cond: [
                { $lt: ['$current_stock', '$minimum_stock_level'] },
                1,
                0
              ]
            }
          },
          totalStockValue: { $sum: { $multiply: ['$current_stock', '$unit_cost'] } }
        }
      }
    ]);

    // Delivery Status
    const deliveryStatus = await Delivery.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // HR Metrics
    const employeeCount = await User.countDocuments({ role: { $in: ['employee', 'manager', 'admin'] } });

    const overview = {
      financial: {
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalPaidOrders: revenueData[0]?.totalPaidOrders || 0,
        avgOrderValue: revenueData[0]?.avgOrderValue || 0
      },
      orders: ordersOverview,
      customers: customerMetrics[0]?.totalCustomers || 0,
      production: productionMetrics,
      inventory: inventoryStatus[0] || { totalMaterials: 0, lowStock: 0, totalStockValue: 0 },
      delivery: deliveryStatus,
      employees: employeeCount
    };

    res.json(overview);
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Sales and Revenue Reports
router.get('/sales-revenue', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Sales trends over time
    let groupFormat;
    switch (groupBy) {
      case 'monthly':
        groupFormat = { year: { $year: '$orderDate' }, month: { $month: '$orderDate' } };
        break;
      case 'weekly':
        groupFormat = { year: { $year: '$orderDate' }, week: { $week: '$orderDate' } };
        break;
      default:
        groupFormat = { year: { $year: '$orderDate' }, month: { $month: '$orderDate' }, day: { $dayOfMonth: '$orderDate' } };
    }

    const salesTrends = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$total_amount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$total_amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top customers by revenue
    const topCustomers = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$customer_id',
          customerName: { $first: '$customer_name' },
          totalRevenue: { $sum: '$total_amount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Payment status analysis
    const paymentAnalysis = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total_amount' }
        }
      }
    ]);

    res.json({
      salesTrends,
      topCustomers,
      paymentAnalysis
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Production Reports
router.get('/production', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Production efficiency metrics
    const efficiencyMetrics = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgTime: { $avg: '$actualTime' },
          totalTime: { $sum: '$actualTime' }
        }
      }
    ]);

    // Production by priority
    const priorityBreakdown = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          avgCompletionTime: { $avg: '$actualTime' }
        }
      }
    ]);

    // Monthly production trends
    const productionTrends = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          jobsCompleted: { $sum: 1 },
          totalProductionTime: { $sum: '$actualTime' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      efficiencyMetrics,
      priorityBreakdown,
      productionTrends
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Inventory Reports
router.get('/inventory', async (req, res) => {
  try {
    // Current stock levels
    const stockLevels = await Raw_materials.find({}, {
      material_name: 1,
      current_stock: 1,
      minimum_stock_level: 1,
      maximum_stock_level: 1,
      unit_cost: 1,
      unit_of_measurement: 1,
      category: 1
    });

    // Low stock alerts
    const lowStockItems = await Raw_materials.find({
      $expr: { $lt: ['$current_stock', '$minimum_stock_level'] }
    });

    // Stock value by category
    const stockValueByCategory = await Raw_materials.aggregate([
      {
        $group: {
          _id: '$category',
          totalValue: { $sum: { $multiply: ['$current_stock', '$unit_cost'] } },
          itemCount: { $sum: 1 },
          avgValue: { $avg: { $multiply: ['$current_stock', '$unit_cost'] } }
        }
      }
    ]);

    // Material usage trends (from production)
    const materialUsage = await Production.aggregate([
      { $unwind: '$items' },
      { $unwind: '$items.materialsUsed' },
      {
        $group: {
          _id: '$items.materialsUsed.materialName',
          totalUsed: { $sum: '$items.materialsUsed.quantityUsed' },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { totalUsed: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      stockLevels,
      lowStockItems,
      stockValueByCategory,
      materialUsage
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer Reports
router.get('/customers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Customer acquisition over time
    const customerAcquisition = await Customer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Customer lifetime value
    const customerLifetimeValue = await Order.aggregate([
      {
        $group: {
          _id: '$customer_id',
          customerName: { $first: '$customer_name' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total_amount' },
          avgOrderValue: { $avg: '$total_amount' },
          firstOrder: { $min: '$orderDate' },
          lastOrder: { $max: '$orderDate' }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    res.json({
      customerAcquisition,
      customerLifetimeValue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get overview report data
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get total revenue from billing
    const revenueData = await Billing.aggregate([
      { $match: { status: 'Paid', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalInvoices: { $sum: 1 }
        }
      }
    ]);

    // Get orders count
    const ordersData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Get production metrics
    const productionData = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalProductionTime: { $sum: '$actual_time' },
          totalJobs: { $sum: 1 },
          avgProductionTime: { $avg: '$actual_time' }
        }
      }
    ]);

    // Get new customers count
    const customerData = await Customer.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          newCustomers: { $sum: 1 }
        }
      }
    ]);

    const overview = {
      revenue: revenueData[0] || { totalRevenue: 0, totalInvoices: 0 },
      orders: ordersData[0] || { totalOrders: 0, avgOrderValue: 0 },
      production: productionData[0] || { totalProductionTime: 0, totalJobs: 0, avgProductionTime: 0 },
      customers: customerData[0] || { newCustomers: 0 }
    };

    res.json(overview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get chart data for dashboard
router.get('/chart-data', async (req, res) => {
  try {
    const { type = 'weekly', period = 7 } = req.query;
    
    // Get last 7 days of order activity
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (period - 1));

    // Generate daily order statistics
    const dailyStats = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$final_amount', '$total'] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Create complete dataset with all days (fill missing days with 0)
    const chartData = [];
    for (let i = 0; i < period; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const existingData = dailyStats.find(stat => 
        stat._id.year === currentDate.getFullYear() &&
        stat._id.month === currentDate.getMonth() + 1 &&
        stat._id.day === currentDate.getDate()
      );

      chartData.push({
        name: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        date: currentDate.toISOString().split('T')[0],
        orders: existingData ? existingData.orders : 0,
        revenue: existingData ? existingData.revenue : 0
      });
    }

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sales report data
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.issueDate = {};
      if (startDate) dateFilter.issueDate.$gte = new Date(startDate);
      if (endDate) dateFilter.issueDate.$lte = new Date(endDate);
    }

    // Monthly revenue breakdown
    const monthlyRevenue = await Billing.aggregate([
      { $match: { status: 'Paid', ...dateFilter } },
      {
        $group: {
          _id: { 
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top customers by revenue
    const topCustomers = await Billing.aggregate([
      { $match: { status: 'Paid', ...dateFilter } },
      {
        $group: {
          _id: '$customer.name',
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Sales by status
    const salesByStatus = await Billing.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      monthlyRevenue,
      topCustomers,
      salesByStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get production report data
router.get('/production', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) dateFilter.created_at.$gte = new Date(startDate);
      if (endDate) dateFilter.created_at.$lte = new Date(endDate);
    }

    // Production efficiency metrics
    const efficiency = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          avgProductionTime: { $avg: '$actual_time' },
          onTimeCompletion: {
            $avg: {
              $cond: [
                { $lte: ['$actual_time', '$estimated_time'] },
                1,
                0
              ]
            }
          },
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Production by machine/status
    const productionByStatus = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalTime: { $sum: '$actual_time' }
        }
      }
    ]);

    // Daily production output
    const dailyProduction = await Production.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$created_at'
            }
          },
          jobsCompleted: { $sum: 1 },
          totalTime: { $sum: '$actual_time' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      efficiency: efficiency[0] || {},
      productionByStatus,
      dailyProduction
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inventory report data
router.get('/inventory', async (req, res) => {
  try {
    // Current inventory levels
    const inventoryLevels = await Raw_materials.find({}, {
      material_name: 1,
      current_quantity: 1,
      reorder_level: 1,
      unit_price: 1
    });

    // Low stock items
    const lowStockItems = await Raw_materials.find({
      $expr: { $lte: ['$current_quantity', '$reorder_level'] }
    }).countDocuments();

    // Overstocked items (items with more than 10x reorder level)
    const overstockedItems = await Raw_materials.find({
      $expr: { $gte: ['$current_quantity', { $multiply: ['$reorder_level', 10] }] }
    }).countDocuments();

    // Total inventory value
    const inventoryValue = await Raw_materials.aggregate([
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: { $multiply: ['$current_quantity', '$unit_price'] }
          },
          totalItems: { $sum: 1 }
        }
      }
    ]);

    // Material usage trends (commented out due to model conflict)
    const materialUsage = [];
    /*
    const materialUsage = await MaterialOrder.aggregate([
      {
        $group: {
          _id: '$material_id',
          totalOrdered: { $sum: '$quantity' },
          orderCount: { $sum: 1 },
          avgQuantity: { $avg: '$quantity' }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]);
    */

    res.json({
      inventoryLevels,
      lowStockItems,
      overstockedItems,
      inventoryValue: inventoryValue[0] || { totalValue: 0, totalItems: 0 },
      materialUsage
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get delivery report data
router.get('/delivery', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.scheduledDate = {};
      if (startDate) dateFilter.scheduledDate.$gte = new Date(startDate);
      if (endDate) dateFilter.scheduledDate.$lte = new Date(endDate);
    }

    // Delivery performance metrics
    const deliveryMetrics = await Delivery.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          onTimeDeliveries: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'Delivered'] },
                  { $lte: ['$deliveredDate', '$scheduledDate'] }
                ]},
                1,
                0
              ]
            }
          },
          avgDeliveryTime: { $avg: '$deliveryTime' }
        }
      }
    ]);

    // Delivery status breakdown
    const deliveryByStatus = await Delivery.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Delivery by area/region
    const deliveryByArea = await Delivery.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$area',
          deliveryCount: { $sum: 1 },
          avgDeliveryTime: { $avg: '$deliveryTime' }
        }
      },
      { $sort: { deliveryCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      deliveryMetrics: deliveryByStatus,
      onTimeRate: deliveryMetrics[0] || { totalDeliveries: 0, onTimeDeliveries: 0 },
      deliveryByArea: deliveryByArea
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// HR Reports
router.get('/hr', async (req, res) => {
  try {
    // Employee statistics by role
    const employeeStats = await User.aggregate([
      { $match: { role: { $in: ['employee', 'manager', 'admin', 'Staff', 'Employee'] } } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Attendance statistics if HR records exist
    let attendanceStats = [];
    try {
      attendanceStats = await HR.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalAttendance: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
    } catch (hrError) {
      console.log('HR attendance data not available:', hrError.message);
    }

    res.json({
      employeeStats,
      attendanceStats,
      totalEmployees: employeeStats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (err) {
    console.error('HR reports error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Financial Summary Reports
router.get('/financial-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    // Revenue from paid orders
    const revenue = await Order.aggregate([
      { $match: { ...dateFilter, payment_status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$final_amount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$final_amount' }
        }
      }
    ]);

    // Pending payments
    const pendingPayments = await Order.aggregate([
      { $match: { ...dateFilter, payment_status: 'pending' } },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$final_amount' },
          pendingOrders: { $sum: 1 }
        }
      }
    ]);

    // Material costs/inventory value
    const materialCosts = await Raw_materials.aggregate([
      {
        $group: {
          _id: null,
          totalInventoryValue: { $sum: { $multiply: ['$current_stock', '$unit_cost'] } },
          totalMaterials: { $sum: 1 }
        }
      }
    ]);

    res.json({
      revenue: revenue[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
      pendingPayments: pendingPayments[0] || { pendingAmount: 0, pendingOrders: 0 },
      materialCosts: materialCosts[0] || { totalInventoryValue: 0, totalMaterials: 0 }
    });
  } catch (err) {
    console.error('Financial summary error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
