const Supplier = require('../models/Suppliers');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const doc = await Supplier.create(req.body);
  res.status(201).json(doc);
});

exports.list = asyncHandler(async (req, res) => {
  const docs = await Supplier.find().sort({ supplier_name: 1 });
  res.json(docs);
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await Supplier.findOne({ supplier_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Supplier.findOneAndUpdate(
    { supplier_id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await Supplier.findOneAndDelete({ supplier_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});