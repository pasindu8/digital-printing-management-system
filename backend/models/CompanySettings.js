const mongoose = require('mongoose');

const CompanySettingsSchema = new mongoose.Schema({
  // Company Information
  companyName: { type: String, default: 'The First Promovier' },
  website: { type: String, default: '' },
  businessEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  taxId: { type: String, default: '' },
  currency: { type: String, default: 'lkr', enum: ['usd', 'eur', 'gbp', 'cad', 'lkr'] },
  businessDescription: { type: String, default: '' },
  
  // Business Hours
  businessHours: {
    monday: { start: { type: String, default: '8:00 AM' }, end: { type: String, default: '5:00 PM' } },
    tuesday: { start: { type: String, default: '8:00 AM' }, end: { type: String, default: '5:00 PM' } },
    wednesday: { start: { type: String, default: '8:00 AM' }, end: { type: String, default: '5:00 PM' } },
    thursday: { start: { type: String, default: '8:00 AM' }, end: { type: String, default: '5:00 PM' } },
    friday: { start: { type: String, default: '8:00 AM' }, end: { type: String, default: '5:00 PM' } },
    saturday: { start: { type: String, default: '9:00 AM' }, end: { type: String, default: '1:00 PM' } },
    sunday: { start: { type: String, default: 'Closed' }, end: { type: String, default: 'Closed' } }
  },

  // System Settings
  timezone: { type: String, default: 'asia-colombo' },
  dateFormat: { type: String, default: 'dd-mm-yyyy', enum: ['mm-dd-yyyy', 'dd-mm-yyyy', 'yyyy-mm-dd'] },
  automaticBackups: { type: String, default: 'daily', enum: ['daily', 'weekly', 'monthly', 'disabled'] },
  maintenanceMode: { type: Boolean, default: false },

  // Notification Settings
  notifications: {
    businessEmail: { type: Boolean, default: true },
    production: { type: Boolean, default: true },
    delivery: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false }
  },

  // Integration Settings
  integrations: {
    accounting: { connected: { type: Boolean, default: false }, provider: { type: String, default: '' } },
    shipping: { connected: { type: Boolean, default: false }, provider: { type: String, default: '' } },
    payment: { connected: { type: Boolean, default: true }, provider: { type: String, default: 'stripe' } },
    emailMarketing: { connected: { type: Boolean, default: false }, provider: { type: String, default: '' } }
  }
}, { timestamps: true });

module.exports = mongoose.model('CompanySettings', CompanySettingsSchema);
