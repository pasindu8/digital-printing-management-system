const express = require('express');
const router = express.Router();
const { Invoice, LedgerEntry, Expense, Payroll, FinancialReport, DashboardMetrics } = require('../models/Finance');
const Billing = require('../models/Billing');
const Order = require('../models/Order');
const { Employee, Attendance } = require('../models/HR');

// Invoice Routes - Automatic invoice generation
router.post('/invoices/generate/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('customer_id');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const invoiceData = {
      invoiceId: 'INV-' + Date.now(),
      orderId: order._id,
      customerId: order.customer_id._id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: order.items.map(item => ({
        description: item.product,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.quantity * item.unit_price
      })),
      subtotal: order.total,
      taxAmount: order.tax_amount,
      discount: order.discount,
      totalAmount: order.final_amount
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Create ledger entry
    const ledgerEntry = new LedgerEntry({
      entryId: 'LE-' + Date.now(),
      description: `Invoice generated for Order ${order.orderId}`,
      reference: invoice.invoiceId,
      account: 'Accounts_Receivable',
      debit: order.final_amount,
      category: 'Income'
    });
    await ledgerEntry.save();

    res.status(201).json({ invoice, message: 'Invoice generated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all invoices
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Billing.find()
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ message: err.message });
  }
});

// Digital Ledger Routes
router.get('/ledger', async (req, res) => {
  try {
    const { account, category, start_date, end_date } = req.query;
    let filter = {};
    
    if (account) filter.account = account;
    if (category) filter.category = category;
    if (start_date || end_date) {
      filter.date = {};
      if (start_date) filter.date.$gte = new Date(start_date);
      if (end_date) filter.date.$lte = new Date(end_date);
    }

    const entries = await LedgerEntry.find(filter).sort({ date: -1 });
    
    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = entries.reverse().map(entry => {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry.toObject(),
        runningBalance
      };
    }).reverse();

    res.json(entriesWithBalance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Automatic payroll calculation based on attendance
router.post('/payroll/calculate/:employeeId', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get attendance records for the period
    const attendanceRecords = await Attendance.find({
      employeeId: req.params.employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    const workingDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present').length;
    const totalHours = attendanceRecords.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const overtimeHours = attendanceRecords.reduce((sum, a) => sum + (a.overtime || 0), 0);

    // Calculate salary
    const dailySalary = employee.employment.salary / 30; // Assuming monthly salary
    const basicSalary = dailySalary * presentDays;
    const overtimePay = overtimeHours * (dailySalary / 8) * 1.5; // 1.5x overtime rate
    const grossSalary = basicSalary + overtimePay;
    
    // Deductions (simplified)
    const tax = grossSalary * 0.1; // 10% tax
    const netSalary = grossSalary - tax;

    const payrollData = {
      payrollId: 'PAY-' + Date.now(),
      employeeId: req.params.employeeId,
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      period: { startDate: new Date(startDate), endDate: new Date(endDate) },
      basicSalary,
      overtime: overtimePay,
      bonuses: 0,
      deductions: { tax, insurance: 0, other: 0, total: tax },
      netSalary,
      attendanceDays: presentDays,
      workingDays,
      status: 'Draft'
    };

    const payroll = new Payroll(payrollData);
    await payroll.save();

    res.status(201).json({ payroll, message: 'Payroll calculated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payroll records
router.get('/payroll', async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    let filter = {};
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const payrolls = await Payroll.find(filter).sort({ 'period.startDate': -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Financial Dashboard - Real-time metrics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Revenue from completed orders
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Completed', 'Delivered'] },
          orderDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$final_amount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Expenses for the month
    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    // Outstanding invoices
    const outstandingInvoices = await Invoice.aggregate([
      {
        $match: { status: { $in: ['sent', 'overdue'] } }
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const revenue = revenueData[0]?.totalRevenue || 0;
    const expenses = expenseData[0]?.totalExpenses || 0;
    const profit = revenue - expenses;
    const outstanding = outstandingInvoices[0]?.totalOutstanding || 0;

    const metrics = {
      revenue,
      expenses,
      profit,
      outstandingInvoices: outstanding,
      cashFlow: revenue - expenses,
      ordersCount: revenueData[0]?.orderCount || 0,
      month: today.toLocaleString('default', { month: 'long', year: 'numeric' })
    };

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate Financial Reports
router.post('/reports/generate', async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    
    let reportData = {};
    
    switch (reportType) {
      case 'profit_loss':
        const revenue = await Order.aggregate([
          {
            $match: {
              status: { $in: ['Completed', 'Delivered'] },
              orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
          },
          { $group: { _id: null, total: { $sum: '$final_amount' } } }
        ]);
        
        const expenses = await Expense.aggregate([
          {
            $match: {
              date: { $gte: new Date(startDate), $lte: new Date(endDate) },
              status: 'Paid'
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        reportData = {
          revenue: revenue[0]?.total || 0,
          expenses: expenses[0]?.total || 0,
          profit: (revenue[0]?.total || 0) - (expenses[0]?.total || 0)
        };
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const report = new FinancialReport({
      reportId: 'RPT-' + Date.now(),
      reportType,
      period: { startDate: new Date(startDate), endDate: new Date(endDate) },
      data: reportData
    });

    await report.save();
    res.status(201).json({ report, message: 'Report generated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Expense Routes
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const data = req.body;
    data.expenseId = 'EXP-' + Date.now();
    
    const expense = new Expense(data);
    await expense.save();
    
    // Create ledger entry for expense
    const ledgerEntry = new LedgerEntry({
      entryId: 'LE-' + Date.now(),
      description: `Expense: ${data.description}`,
      reference: data.expenseId,
      account: 'Expenses',
      credit: data.amount,
      category: 'Expense'
    });
    await ledgerEntry.save();
    
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Payroll Routes
router.get('/payroll', async (req, res) => {
  try {
    const payroll = await Payroll.find().sort({ 'period.startDate': -1 });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/payroll', async (req, res) => {
  try {
    const data = req.body;
    data.payrollId = 'PAY-' + Date.now();
    
    const payroll = new Payroll(data);
    await payroll.save();
    
    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Financial Summary and Reports
router.get('/summary/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    // For simplicity, we'll calculate the profit/loss for the summary
    // In a real-world scenario, you might have a separate, pre-calculated summary collection
    const report = await getProfitLossData(parseInt(year), parseInt(month));
    
    res.json(report);
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    res.status(500).json({ message: 'Failed to fetch financial summary', error: err.message });
  }
});

// Auto-generate invoices for completed orders
router.post('/generate-invoice/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'Completed') {
      return res.status(400).json({ message: 'Order must be completed to generate invoice' });
    }
    
    // Check if invoice already exists
    const existingInvoice = await Billing.findOne({ orderId: order.orderId });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this order' });
    }
    
    // Generate invoice
    const invoice = new Billing({
      invoiceId: 'INV-' + Date.now(),
      orderId: order.orderId,
      customerId: order.customer_name,
      customer: {
        name: order.customer_name,
        email: order.customer_email || `${order.customer_name.toLowerCase().replace(/\s/g, '')}@email.com`,
        address: {
          street: order.customer_address || '123 Street',
          city: 'City',
          state: 'State',
          zipCode: '12345'
        }
      },
      items: order.items.map(item => ({
        description: item.product,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.unit_price * item.quantity
      })),
      subtotal: order.total,
      tax: order.total * 0.08, // 8% tax
      total: order.total * 1.08,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'Sent'
    });
    
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Profit/Loss Report
router.get('/profit-loss/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const report = await getProfitLossData(parseInt(year), parseInt(month));
    res.json(report);
  } catch (err) {
    console.error('Error fetching profit-loss report:', err);
    res.status(500).json({ message: 'Failed to fetch profit-loss report', error: err.message });
  }
});

// Helper function to get profit and loss data
async function getProfitLossData(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Calculate revenue from completed orders
    const completedOrders = await Order.find({
      status: 'Completed',
      orderDate: { $gte: startDate, $lte: endDate }
    });
    
    const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate expenses
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'Paid'
    });
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate payroll
    const payrolls = await Payroll.find({
      'period.startDate': { $gte: startDate },
      'period.endDate': { $lte: endDate },
      status: 'Paid'
    });
    
    const payrollExpenses = payrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0);
    
    const netProfit = revenue - totalExpenses - payrollExpenses;
    
    return {
      period: { year: parseInt(year), month: parseInt(month) },
      revenue: {
        orders: revenue,
        total: revenue
      },
      expenses: {
        operational: totalExpenses,
        payroll: payrollExpenses,
        total: totalExpenses + payrollExpenses
      },
      netProfit,
      ordersCount: completedOrders.length,
      expensesCount: expenses.length
    };
}

// Helper function to calculate financial summary
async function calculateFinancialSummary(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Calculate revenue
  const completedOrders = await Order.find({
    status: 'Completed',
    orderDate: { $gte: startDate, $lte: endDate }
  });
  const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  // Calculate expenses
  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate }
  });
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const netProfit = revenue - totalExpenses;
  
  const summary = new FinancialSummary({
    period: { year, month },
    revenue: { orders: revenue, total: revenue },
    expenses: { total: totalExpenses },
    netProfit
  });
  
  await summary.save();
  return summary;
}

module.exports = router;
