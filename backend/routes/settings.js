const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const User = require('../models/User');
const { authRequired, permit } = require('../middleware/auth');

// Get company settings
router.get('/company', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new CompanySettings();
      await settings.save();
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update company settings
router.put('/company', authRequired, permit('Admin', 'General_Manager'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = new CompanySettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    
    await settings.save();
    res.json({ message: 'Company settings updated successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update business hours
router.put('/company/hours', authRequired, permit('Admin'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = new CompanySettings();
    }
    
    settings.businessHours = { ...settings.businessHours, ...req.body };
    await settings.save();
    
    res.json({ message: 'Business hours updated successfully', businessHours: settings.businessHours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update notification settings
router.put('/notifications', authRequired, async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = new CompanySettings();
    }
    
    settings.notifications = { ...settings.notifications, ...req.body };
    await settings.save();
    
    res.json({ message: 'Notification settings updated successfully', notifications: settings.notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update system settings
router.put('/system', authRequired, permit('Admin'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = new CompanySettings();
    }
    
    const { timezone, dateFormat, automaticBackups, maintenanceMode } = req.body;
    
    if (timezone) settings.timezone = timezone;
    if (dateFormat) settings.dateFormat = dateFormat;
    if (automaticBackups) settings.automaticBackups = automaticBackups;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    
    await settings.save();
    
    res.json({ message: 'System settings updated successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update integration settings
router.put('/integrations/:integration', authRequired, permit('Admin'), async (req, res) => {
  try {
    const { integration } = req.params;
    const { connected, provider } = req.body;
    
    let settings = await CompanySettings.findOne();
    
    if (!settings) {
      settings = new CompanySettings();
    }
    
    if (settings.integrations[integration]) {
      if (connected !== undefined) settings.integrations[integration].connected = connected;
      if (provider) settings.integrations[integration].provider = provider;
    }
    
    await settings.save();
    
    res.json({ 
      message: `${integration} integration updated successfully`, 
      integration: settings.integrations[integration] 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (for user management)
router.get('/users', authRequired, permit('Admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new user
router.post('/users', authRequired, permit('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const user = new User({ name, email, password, role });
    await user.save();
    
    // Return user without password
    const userResponse = await User.findById(user._id, '-password');
    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.put('/users/:id', authRequired, permit('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) user.password = password; // Will be hashed by pre-save hook
    
    await user.save();
    
    // Return user without password
    const userResponse = await User.findById(user._id, '-password');
    res.json({ message: 'User updated successfully', user: userResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', authRequired, permit('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset settings to defaults
router.post('/reset', authRequired, permit('Admin'), async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    
    if (settings) {
      await CompanySettings.findByIdAndDelete(settings._id);
    }
    
    // Create new default settings
    settings = new CompanySettings();
    await settings.save();
    
    res.json({ message: 'Settings reset to defaults successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
