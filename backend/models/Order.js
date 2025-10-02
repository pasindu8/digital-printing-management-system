const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit_price: { type: Number, required: true, min: 0 },
  specifications: { type: String }, // Size, color, material etc.
  design_file_url: { type: String }, // URL to uploaded design file
  raw_materials_used: [{ 
    material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Raw_materials' },
    material_name: { type: String },
    quantity_used: { type: Number },
    unit: { type: String }
  }]
});

// Quotation schema for quote management
const quotationSchema = new mongoose.Schema({
  quotation_id: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  requested_date: { type: Date, default: Date.now },
  estimated_cost: { type: Number },
  valid_until: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'sent', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  items: [itemSchema],
  notes: { type: String },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_date: { type: Date }
});

// Tracking schema for order progress
const trackingSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  location: { type: String } // For delivery tracking
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name: { type: String, required: true },
  customer_email: { type: String },
  customer_phone: { type: String },
  customer_address: { type: String },
  order_type: { type: String, enum: ['standard', 'custom', 'bulk', 'quotation'], default: 'standard' },
  orderDate: { type: Date, default: Date.now },
  delivery_date: { type: Date },
  expected_completion_date: { type: Date },
  items: [itemSchema],
  quotation: quotationSchema,
  notes: { type: String },
  special_instructions: { type: String },
  total: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  final_amount: { type: Number, default: 0 },
  payment_status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'online', 'card'],
    default: 'cash'
  },
  payment_receipt: {
    filename: { type: String },
    originalName: { type: String },
    uploadDate: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedDate: { type: Date },
    rejectionReason: { type: String },
    rejectedDate: { type: Date }
  },
  status: {
    type: String,
    enum: ['New', 'Quote_Requested', 'Quote_Sent', 'Quote_Approved', 'Confirmed', 'In_Production', 'Quality_Check', 'Ready_for_Pickup', 'Ready_for_Delivery', 'Out_for_Delivery', 'Delivered', 'Completed', 'Cancelled'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_employee: { 
    employeeId: { type: String },
    employeeName: { type: String },
    assignedAt: { type: Date },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  production_notes: { type: String },
  delivery_type: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  delivery_address: {
    street: { type: String },
    city: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  tracking_history: [trackingSchema],
  sample_products_viewed: [{ type: String }], // Product IDs customer viewed
  quality_check_notes: { type: String },
  delivery_notes: { type: String },
  communication_log: [{
    date: { type: Date, default: Date.now },
    message: String,
    type: { type: String, enum: ['email', 'phone', 'in_person', 'note'] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  invoice: {
    filename: { type: String },
    filepath: { type: String },
    generatedDate: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailSentDate: { type: Date }
  },
  rejection_email: {
    reason: { type: String },
    emailSent: { type: Boolean, default: false },
    emailSentDate: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
