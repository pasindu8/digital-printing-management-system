const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  productionId: { type: String },
  customer: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  estimatedDuration: { type: Number }, // in hours
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  }
});

const scheduleSchema = new mongoose.Schema({
  scheduleId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  shift: {
    type: String,
    enum: ["Morning", "Afternoon", "Night"],
    required: true
  },
  items: [scheduleItemSchema],
  assignedOperator: { type: String },
  machineId: { type: String },
  status: {
    type: String,
    enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
    default: "Scheduled"
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
