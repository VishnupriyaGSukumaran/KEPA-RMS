const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const Block = require('../models/Block');
const Account = require('../models/Account'); // Block Head account

// 🔹 Create new room allocation
router.post('/', async (req, res) => {
  try {
    const {
      name, pen, recruitmentNumber, trainingCompany,
      mobileNumber, emergencyContact, address, designation,
      unit, district, courseDetails, remark, roomNumber,
      allocationDate, purpose, subPurpose, blockName, allocatedBy
    } = req.body;

    if (!blockName || !allocatedBy) {
      return res.status(400).json({ error: 'Block ID and Allocator ID are required.' });
    }

    // ✅ Conditional check based on purpose
    if (purpose === 'Basic Training') {
      if (!recruitmentNumber) {
        return res.status(400).json({ error: 'Recruitment Number is required for Basic Training.' });
      }

      const existingRecruit = await RoomAllocation.findOne({ recruitmentNumber });
      if (existingRecruit) {
        return res.status(409).json({
          error: `Recruitment Number (${recruitmentNumber}) is already allocated in block "${existingRecruit.block}".`
        });
      }
    } else {
      if (!pen) {
        return res.status(400).json({ error: 'PEN is required for non-Basic Training allocations.' });
      }

      const existingPen = await RoomAllocation.findOne({ pen });
      if (existingPen) {
        return res.status(409).json({
          error: `PEN number (${pen}) is already allocated in block "${existingPen.block}".`
        });
      }
    }

    const newAllocation = new RoomAllocation({
      name,
      pen,
      recruitmentNumber,
      trainingCompany,
      mobileNumber,
      emergencyContact,
      address,
      designation,
      unit,
      district,
      courseDetails,
      remark,
      roomNumber,
      allocationDate,
      purpose,
      subPurpose,
      block: blockName,
      allocatedBy
    });

    await newAllocation.save();
    res.status(201).json(newAllocation);
  } catch (err) {
    console.error('Allocation Error:', err);
    res.status(500).json({ error: 'Failed to allocate room.' });
  }
});


// 🔹 Get allocations for a specific block
router.get('/block/:blockId', async (req, res) => {
  try {
    const allocations = await RoomAllocation.find({ block: req.params.blockId }).populate('allocatedBy', 'pen').sort({ createdAt: -1 });
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch allocations.' });
  }
});

// 🔹 Get allocations by a specific Block Head
router.get('/blockhead/:blockHeadId', async (req, res) => {
  try {
    const allocations = await RoomAllocation.find({ allocatedBy: req.params.blockHeadId }).populate('block', 'name').sort({ createdAt: -1 });
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch allocations.' });
  }
});

// 🔹 Delete (vacate) an allocation by ID
router.delete('/:id', async (req, res) => {
  try {
    await RoomAllocation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room vacated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to vacate room.' });
  }
});

module.exports = router;
