const RawMaterial = require('../models/Raw_materials');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const doc = await RawMaterial.create(req.body);
  res.status(201).json(doc);
});

exports.list = asyncHandler(async (req, res) => {
  const { category, low_stock } = req.query;
  let filter = {};
  
  if (category) filter.category = category;
  
  const docs = await RawMaterial.find(filter).sort({ createdAt: -1 });
  
  // Filter for low stock items if requested
  if (low_stock === 'true') {
    const lowStockItems = docs.filter(item => 
      item.current_stock <= item.minimum_stock_level
    );
    return res.json(lowStockItems);
  }
  
  res.json(docs);
});

// Get low stock alerts
exports.getLowStockAlerts = asyncHandler(async (req, res) => {
  const lowStockItems = await RawMaterial.find({
    $expr: { $lte: ['$current_stock', '$minimum_stock_level'] }
  }).sort({ current_stock: 1 });
  
  const alerts = lowStockItems.map(item => ({
    material_id: item.material_id,
    material_name: item.material_name,
    current_stock: item.current_stock,
    minimum_stock_level: item.minimum_stock_level,
    shortage: item.minimum_stock_level - item.current_stock,
    unit_of_measurement: item.unit_of_measurement,
    urgency: item.current_stock === 0 ? 'critical' : 'warning'
  }));
  
  res.json(alerts);
});

// Get materials used in specific order
exports.getMaterialsForOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const materials = [];
  for (const item of order.items) {
    if (item.raw_materials_used && item.raw_materials_used.length > 0) {
      for (const materialUsage of item.raw_materials_used) {
        const material = await RawMaterial.findById(materialUsage.material_id);
        if (material) {
          materials.push({
            material: material,
            quantity_used: materialUsage.quantity_used,
            unit: materialUsage.unit
          });
        }
      }
    }
  }
  
  res.json(materials);
});

// Record material usage for an order
exports.recordMaterialUsage = asyncHandler(async (req, res) => {
  const { materials } = req.body; // Array of { material_id, quantity_used, unit }
  const order = await Order.findById(req.params.orderId);
  
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const usageRecords = [];
  
  for (const usage of materials) {
    const material = await RawMaterial.findOne({ material_id: usage.material_id });
    if (!material) {
      return res.status(404).json({ error: `Material ${usage.material_id} not found` });
    }
    
    // Check if sufficient stock
    if (material.current_stock < usage.quantity_used) {
      return res.status(400).json({ 
        error: `Insufficient stock for ${material.material_name}. Available: ${material.current_stock}, Required: ${usage.quantity_used}` 
      });
    }
    
    // Deduct from stock
    material.current_stock -= usage.quantity_used;
    await material.save();
    
    usageRecords.push({
      material_id: material._id,
      material_name: material.material_name,
      quantity_used: usage.quantity_used,
      unit: usage.unit || material.unit_of_measurement
    });
  }
  
  // Update order with material usage
  if (!order.items[0].raw_materials_used) {
    order.items[0].raw_materials_used = [];
  }
  order.items[0].raw_materials_used.push(...usageRecords);
  await order.save();
  
  res.json({ message: 'Material usage recorded successfully', usageRecords });
});

// Generate inventory reports
exports.getInventoryReport = asyncHandler(async (req, res) => {
  const { reportType } = req.query;
  
  switch (reportType) {
    case 'stock_summary':
      const summary = await RawMaterial.aggregate([
        {
          $group: {
            _id: '$category',
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$current_stock', '$unit_cost'] } },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ['$current_stock', '$minimum_stock_level'] }, 1, 0]
              }
            }
          }
        }
      ]);
      res.json(summary);
      break;
      
    case 'usage_forecast':
      // Simple usage forecast based on recent orders
      const recentOrders = await Order.find({
        orderDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });
      
      const materialUsage = {};
      recentOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.raw_materials_used) {
            item.raw_materials_used.forEach(material => {
              if (!materialUsage[material.material_name]) {
                materialUsage[material.material_name] = 0;
              }
              materialUsage[material.material_name] += material.quantity_used;
            });
          }
        });
      });
      
      res.json(materialUsage);
      break;
      
    default:
      res.status(400).json({ error: 'Invalid report type' });
  }
});

// Set product pricing
exports.setProductPricing = asyncHandler(async (req, res) => {
  const { product_name, base_cost, labor_cost, overhead_percentage, profit_margin } = req.body;
  
  // Calculate total cost
  const totalCost = base_cost + labor_cost;
  const overhead = totalCost * (overhead_percentage / 100);
  const costWithOverhead = totalCost + overhead;
  const finalPrice = costWithOverhead * (1 + profit_margin / 100);
  
  const pricing = {
    product_name,
    base_cost,
    labor_cost,
    overhead,
    total_cost: costWithOverhead,
    profit_margin_amount: finalPrice - costWithOverhead,
    final_price: finalPrice,
    created_at: new Date()
  };
  
  res.json(pricing);
});

exports.getOne = asyncHandler(async (req, res) => {
  const doc = await RawMaterial.findOne({ material_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await RawMaterial.findOneAndUpdate(
    { material_id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await RawMaterial.findOneAndDelete({ material_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

exports.adjustStock = asyncHandler(async (req, res) => {
  const { delta, reason } = req.body; // positive or negative
  const doc = await RawMaterial.findOne({ material_id: req.params.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const newStock = doc.current_stock + Number(delta || 0);
  if (newStock < 0) return res.status(400).json({ error: 'Stock cannot be negative' });
  
  doc.current_stock = newStock;
  doc.last_updated = new Date();
  
  // Add to stock history if exists
  if (!doc.stock_history) doc.stock_history = [];
  doc.stock_history.push({
    date: new Date(),
    change: Number(delta),
    new_balance: newStock,
    reason: reason || 'Manual adjustment'
  });
  
  await doc.save();
  res.json(doc);
});