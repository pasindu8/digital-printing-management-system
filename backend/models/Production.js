const mongoose = require('mongoose');

const productionItemSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  materialsUsed: [{
    materialId: { type: String, required: true },
    materialName: { type: String, required: true },
    quantityUsed: { type: Number, required: true }
  }],
  estimatedTime: { type: Number }, // in hours
  actualTime: { type: Number }, // in hours
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["Queued", "In Progress", "Completed", "On Hold"],
    default: "Queued"
  }
});

const productionSchema = new mongoose.Schema({
  productionId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  customer: { type: String, required: true },
  items: [productionItemSchema],
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  },
  assignedTo: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Production', productionSchema);
