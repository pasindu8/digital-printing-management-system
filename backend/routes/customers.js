const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { authRequired, permit } = require('../middleware/auth');

// Create customer - temporarily removing auth for development
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/customers called with body:', req.body);
    const data = req.body;
    data.customerId = 'CUST-' + Date.now();

    console.log('Creating customer with data:', data);
    const customer = new Customer(data);
    await customer.save();
    console.log('Customer saved successfully:', customer);

    res.status(201).json({ customer });
  } catch (err) {
    console.error('Error creating customer:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get all customers - temporarily removing auth for development
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get customer by ID - temporarily removing auth for development
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update customer - temporarily removing auth for development
router.put('/:id', async (req, res) => {
  try {
    const updatedCustomer = await Customer.findOneAndUpdate({ customerId: req.params.id }, req.body, { new: true });
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete customer - temporarily removing auth for development
router.delete('/:id', async (req, res) => {
  try {
    const deletedCustomer = await Customer.findOneAndDelete({ customerId: req.params.id });
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
