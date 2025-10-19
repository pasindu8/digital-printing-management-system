require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file. Please add it.');
  process.exit(1);
}
if (!DB_NAME) {
  console.error('❌ DB_NAME not found in .env file. Please add it (e.g., DB_NAME=printing_system).');
  process.exit(1);
}

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeObjectId = (value) => {
  if (!value && value !== 0) {
    return value === null ? null : undefined;
  }
  if (value instanceof ObjectId) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return new ObjectId(value);
    } catch (err) {
      return value;
    }
  }
  if (isPlainObject(value) && typeof value.$oid === 'string') {
    try {
      return new ObjectId(value.$oid);
    } catch (err) {
      return value.$oid;
    }
  }
  return value;
};

const normalizeNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (isPlainObject(value)) {
    if ('$numberInt' in value) {
      return parseInt(value.$numberInt, 10);
    }
    if ('$numberDouble' in value) {
      return parseFloat(value.$numberDouble);
    }
    if ('$numberDecimal' in value) {
      return Number(value.$numberDecimal);
    }
    if ('$numberLong' in value) {
      return parseInt(value.$numberLong, 10);
    }
  }
  return value;
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return value;
};

const normalizeDate = (value) => {
  if (!value) {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? value : dateValue;
  }
  if (isPlainObject(value) && '$date' in value) {
    const rawDate = value.$date;
    if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      const dateValue = new Date(rawDate);
      return Number.isNaN(dateValue.getTime()) ? value : dateValue;
    }
    if (isPlainObject(rawDate) && '$numberLong' in rawDate) {
      const dateValue = new Date(parseInt(rawDate.$numberLong, 10));
      return Number.isNaN(dateValue.getTime()) ? value : dateValue;
    }
  }
  return value;
};

async function runMigration() {
  const client = new MongoClient(MONGO_URI);
  console.log('🚀 Starting delivery data migration...');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB.');

    const db = client.db(DB_NAME);
    const deliveriesCollection = db.collection('deliveries');

    const deliveriesToUpdate = await deliveriesCollection.find({}).toArray();
    console.log(`🔍 Found ${deliveriesToUpdate.length} deliveries to check.`);

    let updatedCount = 0;

    for (const delivery of deliveriesToUpdate) {
      let needsUpdate = false;
      const setOps = {};
      const unsetOps = {};

      // Handle 'items' array fields like quantity and weight
      if (delivery.items && Array.isArray(delivery.items)) {
        const newItems = delivery.items.map(item => {
          const newItem = { ...item };
          let itemChanged = false;

          const normalizedQuantity = normalizeNumber(item.quantity);
          if (normalizedQuantity !== item.quantity && normalizedQuantity !== undefined) {
            newItem.quantity = normalizedQuantity;
            itemChanged = true;
          }

          const normalizedWeight = normalizeNumber(item.weight);
          if (normalizedWeight !== item.weight && normalizedWeight !== undefined) {
            newItem.weight = normalizedWeight;
            itemChanged = true;
          }

          const normalizedItemId = normalizeObjectId(item._id);
          if (normalizedItemId instanceof ObjectId && !(item._id instanceof ObjectId)) {
            newItem._id = normalizedItemId;
            itemChanged = true;
          }

          if (itemChanged) {
            needsUpdate = true;
          }

          return newItem;
        });

        if (needsUpdate) {
          setOps.items = newItems;
        }
      }

      // Normalize orderId: allow null otherwise store as ObjectId
      if ('orderId' in delivery) {
        const normalizedOrderId = normalizeObjectId(delivery.orderId);
        if (normalizedOrderId === null && delivery.orderId !== null) {
          setOps.orderId = null;
          needsUpdate = true;
        } else if (normalizedOrderId instanceof ObjectId) {
          if (!(delivery.orderId instanceof ObjectId) || !normalizedOrderId.equals(delivery.orderId)) {
            setOps.orderId = normalizedOrderId;
            needsUpdate = true;
          }
        } else if (normalizedOrderId === undefined && delivery.orderId !== undefined) {
          unsetOps.orderId = "";
          needsUpdate = true;
        }
      }

      if (delivery.customer) {
        const customerSetOps = {};

        if (delivery.customer.customerId !== undefined) {
          const normalizedCustomerId = normalizeObjectId(delivery.customer.customerId);
          if (normalizedCustomerId === null && delivery.customer.customerId !== null) {
            customerSetOps['customer.customerId'] = null;
          } else if (normalizedCustomerId instanceof ObjectId) {
            if (!(delivery.customer.customerId instanceof ObjectId) || !normalizedCustomerId.equals(delivery.customer.customerId)) {
              customerSetOps['customer.customerId'] = normalizedCustomerId;
            }
          }
        }

        if (delivery.customer.address) {
          const { coordinates } = delivery.customer.address;
          if (coordinates) {
            const normalizedLat = normalizeNumber(coordinates.lat);
            const normalizedLng = normalizeNumber(coordinates.lng);

            if (normalizedLat !== coordinates.lat) {
            if (normalizedLat !== coordinates.lat && normalizedLat != null) {
              customerSetOps['customer.address.coordinates.lat'] = normalizedLat ?? null;
            }
            if (normalizedLng !== coordinates.lng) {
            if (normalizedLng !== coordinates.lng && normalizedLng != null) {
              customerSetOps['customer.address.coordinates.lng'] = normalizedLng ?? null;
            }

            // Generate and update googleMapsUrl
            const lat = typeof normalizedLat === 'number' ? normalizedLat : coordinates.lat;
            const lng = typeof normalizedLng === 'number' ? normalizedLng : coordinates.lng;

            if (typeof lat === 'number' && typeof lng === 'number') {
              const newUrl = `https://maps.google.com/?q=${lat},${lng}`;
              if (delivery.customer.address.googleMapsUrl !== newUrl) {
                customerSetOps['customer.address.googleMapsUrl'] = newUrl;
              }
            }
          }
        }

        Object.assign(setOps, customerSetOps);
        needsUpdate = needsUpdate || Object.keys(customerSetOps).length > 0;
      }

      const dateFields = {
        scheduledDate: delivery.scheduledDate,
        deliveredDate: delivery.deliveredDate,
        actualDeliveryTime: delivery.actualDeliveryTime,
        createdAt: delivery.createdAt
      };

      for (const [field, originalValue] of Object.entries(dateFields)) {
        const normalizedValue = normalizeDate(originalValue);
        if (normalizedValue instanceof Date) {
          const originalTime = originalValue instanceof Date ? originalValue.getTime() : null;
          if (normalizedValue.getTime() !== originalTime) {
            setOps[field] = normalizedValue;
            needsUpdate = true;
          }
        } else if (normalizedValue !== originalValue && normalizedValue !== undefined) {
          setOps[field] = normalizedValue;
          needsUpdate = true;
        }
      }

      if ('signatureRequired' in delivery) {
        const normalizedSignatureRequired = normalizeBoolean(delivery.signatureRequired);
        if (normalizedSignatureRequired !== delivery.signatureRequired) {
          setOps.signatureRequired = normalizedSignatureRequired;
          needsUpdate = true;
        }
      }

      if (delivery.route) {
        const { route } = delivery;
        const routeUpdates = {};

        const startLat = route.startLocation?.coordinates?.lat;
        const startLng = route.startLocation?.coordinates?.lng;
        const endLat = route.endLocation?.coordinates?.lat;
        const endLng = route.endLocation?.coordinates?.lng;

        const normalizedStartLat = normalizeNumber(startLat);
        const normalizedStartLng = normalizeNumber(startLng);
        const normalizedEndLat = normalizeNumber(endLat);
        const normalizedEndLng = normalizeNumber(endLng);

        if (normalizedStartLat !== startLat) {
          routeUpdates['route.startLocation.coordinates.lat'] = normalizedStartLat ?? null;
        }
        if (normalizedStartLng !== startLng) {
          routeUpdates['route.startLocation.coordinates.lng'] = normalizedStartLng ?? null;
        }
        if (normalizedEndLat !== endLat) {
          routeUpdates['route.endLocation.coordinates.lat'] = normalizedEndLat ?? null;
        }
        if (normalizedEndLng !== endLng) {
          routeUpdates['route.endLocation.coordinates.lng'] = normalizedEndLng ?? null;
        }

        const normalizedDistance = normalizeNumber(route.distance);
        if (normalizedDistance !== route.distance) {
          routeUpdates['route.distance'] = normalizedDistance ?? null;
        }

        const normalizedDuration = normalizeNumber(route.estimatedDuration);
        if (normalizedDuration !== route.estimatedDuration) {
          routeUpdates['route.estimatedDuration'] = normalizedDuration ?? null;
        }

        Object.assign(setOps, routeUpdates);
        needsUpdate = needsUpdate || Object.keys(routeUpdates).length > 0;
      }

      if ('__v' in delivery) {
        const normalizedVersion = normalizeNumber(delivery.__v);
        if (normalizedVersion !== delivery.__v && normalizedVersion !== undefined) {
          setOps.__v = normalizedVersion;
          needsUpdate = true;
        }
      }

      // If any updates are needed for this document, perform the update
      if (needsUpdate) {
        const updateOps = {};
        if (Object.keys(setOps).length) {
          updateOps.$set = setOps;
        }
        if (Object.keys(unsetOps).length) {
          updateOps.$unset = unsetOps;
        }

        await deliveriesCollection.updateOne({ _id: delivery._id }, updateOps);
        updatedCount++;
        console.log(`🔧 Updated delivery: ${delivery.deliveryId}`);
      }
    }

    console.log('-----------------------------------------');
    console.log(`🏁 Migration complete. Total documents updated: ${updatedCount}`);
  } catch (e) {
    console.error('❌ An error occurred during migration:', e);
  } finally {
    await client.close();
    console.log('🚪 MongoDB connection closed.');
  }
}

runMigration();
