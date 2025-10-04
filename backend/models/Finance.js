const mongoose = require('mongoose');

// Invoice Model for automatic invoice generation
const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  notes: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Digital Ledger for financial transactions
const ledgerEntrySchema = new mongoose.Schema({
  entryId: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  reference: { type: String }, // Order ID, Invoice ID, etc.
  account: {
    type: String,
    enum: ['Cash', 'Bank', 'Accounts_Receivable', 'Accounts_Payable', 'Sales', 'Expenses', 'Inventory'],
    required: true
  },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['Income', 'Expense', 'Asset', 'Liability', 'Equity'],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Expense Model for recording business expenses
const expenseSchema = new mongoose.Schema({
  expenseId: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ['Materials', 'Equipment', 'Utilities', 'Rent', 'Salaries', 'Marketing', 'Maintenance', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  vendor: { type: String },
  receipt: { type: String }, // File path or URL
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque'],
    required: true
  },
  approvedBy: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid'],
    default: 'Pending'
  },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Payroll Model for staff salary management
const payrollSchema = new mongoose.Schema({
  payrollId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  basicSalary: { type: Number, required: true },
  overtime: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  attendanceDays: { type: Number, required: true },
  workingDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Paid'],
    default: 'Draft'
  },
  paymentDate: { type: Date },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Financial Reports Model
const financialReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  reportType: {
    type: String,
    enum: ['income_statement', 'balance_sheet', 'cash_flow', 'profit_loss', 'sales_summary'],
    required: true
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  data: { type: mongoose.Schema.Types.Mixed }, // Flexible structure for different report types
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date, default: Date.now }
});

// Dashboard Metrics for real-time financial overview
const dashboardMetricsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  outstandingInvoices: { type: Number, default: 0 },
  cashFlow: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  customersCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

// Models export
module.exports = {
  Invoice: mongoose.model('Invoice', invoiceSchema),
  LedgerEntry: mongoose.model('LedgerEntry', ledgerEntrySchema),
  Expense: mongoose.model('Expense', expenseSchema),
  Payroll: mongoose.model('Payroll', payrollSchema),
  FinancialReport: mongoose.model('FinancialReport', financialReportSchema),
  DashboardMetrics: mongoose.model('DashboardMetrics', dashboardMetricsSchema)
};
