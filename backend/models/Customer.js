const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // For customer login
  phone: { type: String }, // Made optional for signup users
  alternative_phone: { type: String },
  company_name: { type: String },
  address: {
    street: { type: String }, // Made optional for signup users
    city: { type: String }, // Made optional for signup users
    state: { type: String }, // Made optional for signup users
    zipCode: { type: String }, // Made optional for signup users
    country: { type: String, default: 'Sri Lanka' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  customer_type: { 
    type: String, 
    enum: ['individual', 'business', 'corporate'],
    default: 'individual'
  },
  preferred_contact_method: {
    type: String,
    enum: ['email', 'phone', 'whatsapp'],
    default: 'phone'
  },
  tax_number: { type: String },
  credit_limit: { type: Number, default: 0 },
  payment_terms: { type: String, default: 'cash' },
  notes: { type: String },
  account_status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  email_verified: { type: Boolean, default: false },
  last_login: { type: Date },
  order_history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status: {
    type: String,
    enum: ["Active", "Inactive", "Blacklisted"],
    default: "Active"
  },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderDate: { type: Date },
  registration_date: { type: Date, default: Date.now },
  communication_preferences: {
    email_notifications: { type: Boolean, default: true },
    sms_notifications: { type: Boolean, default: true },
    promotional_emails: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
