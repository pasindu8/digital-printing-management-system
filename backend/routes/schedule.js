const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { authRequired, permit } = require('../middleware/auth');

// Create schedule - temporarily removing auth for development
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    data.scheduleId = 'SCH-' + Date.now();

    const schedule = new Schedule(data);
    await schedule.save();

    res.status(201).json({ schedule });
  } catch (err) {
    console.error('Error creating schedule:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get all schedules - temporarily removing auth for development
router.get('/', async (req, res) => {
  try {
    const { date, shift, status } = req.query;
    let filter = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    
    if (shift) filter.shift = shift;
    if (status) filter.status = status;

    const schedules = await Schedule.find(filter).sort({ date: 1, shift: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get schedule by ID - temporarily removing auth for development
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update schedule - temporarily removing auth for development
router.put('/:id', async (req, res) => {
  try {
    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update schedule status - temporarily removing auth for development
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!updatedSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete schedule - temporarily removing auth for development
router.delete('/:id', async (req, res) => {
  try {
    const deletedSchedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!deletedSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
