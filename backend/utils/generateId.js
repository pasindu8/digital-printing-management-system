const Counter = require('../models/Counter');

async function getNextSequence(name) {
  const ret = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return ret.seq;
}

function format(prefix, num, width = 3) {
  return `${prefix}-${String(num).padStart(width, '0')}`;
}

async function assignIfMissing(doc, field, counterName, prefix) {
  if (!doc[field]) {
    const next = await getNextSequence(counterName);
    doc[field] = format(prefix, next);
  }
}

module.exports = { assignIfMissing };