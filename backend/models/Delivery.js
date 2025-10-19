const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  product: { type: String, required: true },
  quantity: { type: Number, required: true },
  weight: { type: Number },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number }
  },
  specialInstructions: { type: String }
});

const deliverySchema = new mongoose.Schema({
  deliveryId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Changed to not required
  customer: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      googleMapsUrl: { type: String } // Direct link to Google Maps
    },
    phone: { type: String },
    email: { type: String }
  },
  items: [deliveryItemSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Delivery person
  scheduledDate: { type: Date, required: true },
  deliveredDate: { type: Date },
  estimatedTime: { type: String }, // Estimated delivery time window
  actualDeliveryTime: { type: Date },
  route: {
    startLocation: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    endLocation: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    distance: { type: Number }, // in kilometers
    estimatedDuration: { type: Number } // in minutes
  },
  driverName: { type: String },
  vehicleId: { type: String },
  trackingNumber: { type: String },
  status: {
    type: String,
    enum: ["Scheduled", "In Transit", "Delivered", "Failed", "Cancelled"],
    default: "Scheduled"
  },
  deliveryNotes: { type: String },
  signatureRequired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Delivery', deliverySchema);
