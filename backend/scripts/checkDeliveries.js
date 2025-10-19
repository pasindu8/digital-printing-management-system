require('dotenv').config();
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
    const now = new Date();
    const localEndOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const scheduled = await Delivery.find({ status: 'Scheduled' }).sort({ scheduledDate: 1 }).limit(50);

    console.log('Now:', now.toISOString());
    console.log('Local end of day cutoff:', localEndOfDay.toISOString());
    console.log('--- Scheduled Deliveries ---');
    scheduled.forEach(doc => {
      console.log({
        deliveryId: doc.deliveryId,
        scheduledDate: doc.scheduledDate ? doc.scheduledDate.toISOString() : null,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
        status: doc.status,
        hasTracking: Array.isArray(doc.tracking_updates)
      });
    });

    const eligibleCount = await Delivery.countDocuments({
      status: 'Scheduled',
      scheduledDate: { $lte: localEndOfDay }
    });
    console.log('Eligible for promotion:', eligibleCount);
  } catch (err) {
    console.error('Error running check:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
