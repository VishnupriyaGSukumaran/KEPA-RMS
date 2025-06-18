const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room');

// ===== POST: Create Rooms and Update Block =====
router.post('/superadmin/create-rooms', async (req, res) => {
  const { blockName, rooms } = req.body;

  if (!blockName || !rooms || !Array.isArray(rooms)) {
    return res.status(400).json({ message: 'Incomplete room data received' });
  }

  try {
    await Room.insertMany(rooms);

    const grouped = {};
    rooms.forEach(room => {
      if (!grouped[room.roomType]) grouped[room.roomType] = [];
      grouped[room.roomType].push(room);
    });

    const blockTypeDetails = Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length,
      rooms: grouped[type]
    }));

    await Block.findOneAndUpdate(
      { blockName },
      { $set: { blockTypeDetails } },
      { new: true, upsert: true }
    );

    const summary = blockTypeDetails.map(typeGroup => {
      const facilitySet = new Set();
      typeGroup.rooms.forEach(room => {
        if (room.isAC) facilitySet.add('AC');
        if (room.attachedBathroom) facilitySet.add('Attached Bathroom');
        Object.keys(room.additionalFacilities || {}).forEach(f => facilitySet.add(f));
      });
      return {
        blockType: typeGroup.type,
        count: typeGroup.count,
        facilities: Array.from(facilitySet)
      };
    });

    return res.status(200).json({ message: 'Rooms saved successfully', summary });
  } catch (error) {
    console.error('Error saving rooms:', error);
    return res.status(500).json({ message: 'Server error while saving room data' });
  }
});

// ===== ✅ PUT: Update Room by ID =====
router.put('/:id', async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedRoom) return res.status(404).json({ error: 'Room not found' });
    res.json(updatedRoom);
  } catch (err) {
    console.error('Room update error:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

module.exports = router;
