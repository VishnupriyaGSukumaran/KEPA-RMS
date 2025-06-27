
// ✅ File: routes/roomAllocationRoutes.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');

router.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (!data.blockName || !data.allocatedBy) {
      return res.status(400).json({ error: 'Block ID and Allocator ID are required.' });
    }

    if (data.purpose === 'Basic Training') {
      if (!data.recruitmentNumber) {
        return res.status(400).json({ error: 'Recruitment Number is required for Basic Training.' });
      }
      const existingRecruit = await RoomAllocation.findOne({ recruitmentNumber: data.recruitmentNumber });
      if (existingRecruit) {
        return res.status(409).json({ error: `Recruitment Number (${data.recruitmentNumber}) is already allocated.` });
      }
    } else {
      if (!data.pen) {
        return res.status(400).json({ error: 'PEN is required for non-Basic Training allocations.' });
      }
      const existingPen = await RoomAllocation.findOne({ pen: data.pen });
      if (existingPen) {
        return res.status(409).json({ error: `PEN number (${data.pen}) is already allocated.` });
      }
    }

    const newAllocation = new RoomAllocation({
      ...data,
      block: data.blockName
    });

    await newAllocation.save();
    res.status(201).json(newAllocation);
  } catch (err) {
    console.error('Allocation Error:', err);
    res.status(500).json({ error: 'Failed to allocate room.' });
  }
});

router.post('/fetch-person', async (req, res) => {
  const { pen, recruitmentNumber } = req.body;

  try {
    let person = pen
      ? await RoomAllocation.findOne({ pen })
      : await RoomAllocation.findOne({ recruitmentNumber });

    if (!person) {
      return res.status(404).json({ error: 'No person found with given details.' });
    }

    res.status(200).json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await RoomAllocation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Room vacated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to vacate room.' });
  }
});

module.exports = router;