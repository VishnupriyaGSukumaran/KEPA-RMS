const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');

// POST - save allocation data
router.post('/', async (req, res) => {
  try {
    const newAllocation = new Allocation(req.body);
    await newAllocation.save();
    res.status(201).json({ message: 'Room allocated successfully' });
  } catch (err) {
    console.error('Error saving allocation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
