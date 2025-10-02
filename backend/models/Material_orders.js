const mongoose = require('mongoose');
const { assignIfMissing } = require('../utils/generateId');

const materialOrderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      trim: true // Example: MO-001
    },
    // Foreign keys referencing code fields in existing collections
    supplier_id: {
      type: String,
      ref: 'Supplier',
      required: true,
      trim: true
    },
    material_id: {
      type: String,
      ref: 'RawMaterial',
      required: true,
      trim: true
    },
    order_date: {
      type: Date,
      default: Date.now
    },
    delivery_date: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Ordered', 'In Transit', 'Delivered', 'Cancelled'],
      default: 'Ordered'
    },
    quantity_ordered: {
      type: Number,
      required: true,
      min: 0
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0
    },
    total_price: {
      type: Number,
      min: 0
      // Will be auto-calculated in pre-save
    },
    damaged_items_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    finance_transfer_status: {
      type: String,
      enum: ['Pending', 'Transferred'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate total_price and basic validations
materialOrderSchema.pre('save', function (next) {
  if (this.isModified('quantity_ordered') || this.isModified('unit_price')) {
    this.total_price = this.quantity_ordered * this.unit_price;
  }
  if (this.damaged_items_amount > this.quantity_ordered) {
    return next(new Error('damaged_items_amount cannot exceed quantity_ordered'));
  }
  next();
});

materialOrderSchema.pre('validate', async function () {
  await assignIfMissing(this, 'order_id', 'material_order', 'MO');
});

// Helpful indexes
materialOrderSchema.index({ order_id: 1 }, { unique: true });
materialOrderSchema.index({ supplier_id: 1 });
materialOrderSchema.index({ material_id: 1 });
materialOrderSchema.index({ status: 1 });

module.exports = mongoose.model('MaterialOrder', materialOrderSchema, 'material_orders');
