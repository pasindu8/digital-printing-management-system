require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const rawMaterials = require('./routes/rawMaterials');
const suppliers = require('./routes/suppliers');
const materialOrders = require('./routes/materialOrders');
const orderRoutes = require('./routes/orderRoutes');
const customers = require('./routes/customers');
const production = require('./routes/production');
const schedule = require('./routes/schedule');
const delivery = require('./routes/delivery');
const billing = require('./routes/billing');
const finance = require('./routes/finance');
const hr = require('./routes/hr-simple');
const reports = require('./routes/reports');
const settings = require('./routes/settings');
const notifications = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/raw-materials', rawMaterials);
app.use('/api/suppliers', suppliers);
app.use('/api/material-orders', materialOrders);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customers);
app.use('/api/production', production);
app.use('/api/schedule', schedule);
app.use('/api/delivery', delivery);
app.use('/api/billing', billing);
app.use('/api/finance', finance);
app.use('/api/hr', hr);
app.use('/api/reports', reports);
app.use('/api/settings', settings);
app.use('/api', notifications);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);

module.exports = app;