const mongoose = require('mongoose');

// Employee_Details Model - stores work-related information linked to Users
const employeeDetailsSchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true,
    index: true
  },
  employment: {
    department: {
      type: String,
      enum: ['Production', 'Sales', 'Administration', 'Finance', 'Delivery', 'HR'],
      required: true
    },
    position: { 
      type: String, 
      required: true 
    },
    salary: { 
      type: Number, 
      required: true,
      min: 0
    },
    hireDate: { 
      type: Date, 
      required: true 
    },
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
  workload: {
    assignedOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    activeOrders: { type: Number, default: 0 },
    skills: [{ type: String }],
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'On Leave'],
      default: 'Available'
    }
  },
  performanceMetrics: {
    tasksCompleted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    punctualityScore: { type: Number, default: 100, min: 0, max: 100 },
    lastReviewDate: { type: Date }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to populate user data
employeeDetailsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Index for efficient queries
employeeDetailsSchema.index({ userId: 1 });
employeeDetailsSchema.index({ employeeId: 1 });
employeeDetailsSchema.index({ 'employment.department': 1 });
employeeDetailsSchema.index({ 'employment.status': 1 });

module.exports = mongoose.model('Employee_Details', employeeDetailsSchema);