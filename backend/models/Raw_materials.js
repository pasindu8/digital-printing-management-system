const mongoose = require('mongoose');
const { assignIfMissing } = require('../utils/generateId');

const rawMaterialSchema = new mongoose.Schema(
  {
    material_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
      // Example: "RM-001"
    },
    material_name: {
      type: String,
      required: true,
      trim: true
    },
    material_type: {
      type: String,
      required: true,
      trim: true
      // Example: "Chemical", "Textile", "Paper", "Ink", "Adhesive"
    },
    category: {
      type: String,
      required: true,
      enum: ['Ink', 'Paper', 'Adhesive', 'Chemical', 'Equipment', 'Packaging', 'Other'],
      trim: true
    },
    unit_of_measurement: {
      type: String,
      required: true,
      trim: true
      // Example: "kg", "liters", "meters", "pieces"
    },
    current_stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minimum_stock_level: {
      type: Number,
      required: true,
      min: 0,
      default: 10 // Low stock alert threshold
    },
    maximum_stock_level: {
      type: Number,
      min: 0,
      default: 1000
    },
    unit_cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true
    },
    supplier_contact: {
      type: String,
      trim: true
    },
    restock_threshold: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    last_purchase_date: {
      type: Date
    },
    description: {
      type: String,
      trim: true
    },
    // Google Drive image fields
    image: {
      driveFileId: {
        type: String
      },
      fileName: {
        type: String
      },
      directLink: {
        type: String
      },
      alternateLink: {
        type: String
      },
      webViewLink: {
        type: String
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true
  }
);

// Index (optional redundancy since unique already creates one)
rawMaterialSchema.index({ material_id: 1 }, { unique: true });

rawMaterialSchema.pre('validate', async function () {
  await assignIfMissing(this, 'material_id', 'raw_material', 'RM');
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema, 'raw_materials');
