const express = require('express');
const router = express.Router();
const Production = require('../models/Production');
const { authRequired, permit } = require('../middleware/auth');

// Create production entry - temporarily removing auth for development
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.productionId = 'PROD-' + Date.now();

    const production = new Production(data);
    await production.save();

    res.status(201).json({ production });
  } catch (err) {
    console.error('Error creating production:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get all production records - temporarily removing auth for development
router.get('/', async (req, res) => {
  try {
    const productions = await Production.find().sort({ createdAt: -1 });
    res.json(productions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get production by ID - temporarily removing auth for development
router.get('/:id', async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: 'Production entry not found' });
    }
    res.json(production);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update production entry - temporarily removing auth for development
router.put('/:id', async (req, res) => {
  try {
    const updatedProduction = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduction) {
      return res.status(404).json({ message: 'Production entry not found' });
    }
    res.json(updatedProduction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update production status - temporarily removing auth for development
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Queued', 'In Progress', 'Completed', 'On Hold'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const production = await Production.findById(req.params.id);
    if (!production) {
      return res.status(404).json({ message: 'Production entry not found' });
    }

    production.status = status;
    if (status === 'Completed') {
      production.completedAt = new Date();
    }
    
    await production.save();
    res.json(production);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete production entry - temporarily removing auth for development
router.delete('/:id', async (req, res) => {
  try {
    const production = await Production.findByIdAndDelete(req.params.id);
    if (!production) {
      return res.status(404).json({ message: 'Production entry not found' });
    }
    res.json({ message: 'Production entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
