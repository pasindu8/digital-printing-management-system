const mongoose = require('mongoose');

// Employee Model for HR management with enhanced features
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String }
    },
    dateOfBirth: { type: Date },
    nationalId: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String }
    }
  },
  employment: {
    position: { type: String, required: true },
    department: {
      type: String,
      enum: ['Production', 'Sales', 'Administration', 'Finance', 'Delivery', 'HR'],
      required: true
    },
    hireDate: { type: Date, required: true },
    salary: { type: Number, required: true },
    workSchedule: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract'],
      default: 'Full-time'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Terminated'],
      default: 'Active'
    },
    workingHours: {
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' },
      lunchBreak: { type: Number, default: 60 } // minutes
    }
  },
  permissions: {
    canViewOrders: { type: Boolean, default: false },
    canEditOrders: { type: Boolean, default: false },
    canViewInventory: { type: Boolean, default: false },
    canEditInventory: { type: Boolean, default: false },
    canViewFinance: { type: Boolean, default: false },
    canEditFinance: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageHR: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false }
  },
  performanceMetrics: {
    tasksCompleted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    punctualityScore: { type: Number, default: 100 },
    lastReviewDate: { type: Date }
  },
  workload: {
    assignedOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    activeOrders: { type: Number, default: 0 },
    skills: [{ type: String }], // e.g., ['Graphic Design', 'Printing', 'Binding']
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Overloaded', 'On Leave'],
      default: 'Available'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Attendance Model for tracking employee attendance
const attendanceSchema = new mongoose.Schema({
  attendanceId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  date: { type: Date, required: true },
  clockIn: { type: Date },
  clockOut: { type: Date },
  breakTime: { type: Number, default: 0 }, // minutes
  totalHours: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-day', 'On-leave'],
    default: 'Present'
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Leave Management Model
const leaveSchema = new mongoose.Schema({
  leaveId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Unpaid'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  appliedDate: { type: Date, default: Date.now },
  reviewedBy: { type: String }, // employeeId of reviewer
  reviewedDate: { type: Date },
  reviewComments: { type: String },
  attachments: [{ type: String }], // File URLs
  createdAt: { type: Date, default: Date.now }
});

// Task Assignment Model for performance tracking
const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: String, required: true }, // employeeId
  assignedBy: { type: String, required: true }, // employeeId
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  dueDate: { type: Date },
  completedDate: { type: Date },
  orderId: { type: String }, // If task is related to an order
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Work Shift Model for scheduling
const shiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true },
  employees: [{ type: String }], // Array of employeeIds
  date: { type: Date, required: true },
  department: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// HR Reports Model
const hrReportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  reportType: {
    type: String,
    enum: ['attendance_summary', 'salary_report', 'performance_review', 'leave_summary', 'employee_list'],
    required: true
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  data: { type: mongoose.Schema.Types.Mixed },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date, default: Date.now }
});

// Salary Model for employee salary management
const salarySchema = new mongoose.Schema({
  salaryId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 }, // Rate per hour for overtime
  overtimeAmount: { type: Number, default: 0 }, // Calculated OT amount
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  Employee: mongoose.model('Employee', employeeSchema),
  Task: mongoose.model('Task', taskSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Leave: mongoose.model('Leave', leaveSchema),
  Shift: mongoose.model('Shift', shiftSchema),
  HRReport: mongoose.model('HRReport', hrReportSchema),
  Salary: mongoose.model('Salary', salarySchema)
};
