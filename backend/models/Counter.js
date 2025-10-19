const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // name e.g. raw_material, supplier, material_order
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema, 'counters');