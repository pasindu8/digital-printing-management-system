const mongoose = require('mongoose');
const { assignIfMissing } = require('../utils/generateId');

const supplierSchema = new mongoose.Schema(
  {
    supplier_id: {
      type: String,
      required: true,
      unique: true,
      trim: true // Example: SUP-001
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true
    },
    contact_person: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email']
    },
    phone_number: {
      type: String,
      trim: true
      // Add a regex if you want to enforce a pattern
      // match: [/^\+?[0-9\-()\s]{7,20}$/, 'Invalid phone number']
    }
  },
  {
    timestamps: true
  }
);

// Index (unique already creates one, added compound example if needed later)
// supplierSchema.index({ supplier_name: 1 });

supplierSchema.pre('validate', async function () {
  await assignIfMissing(this, 'supplier_id', 'supplier', 'SUP');
});

module.exports = mongoose.model('Supplier', supplierSchema, 'suppliers');