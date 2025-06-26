const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room');

// ===== ✅ POST: Create Rooms and Update Block =====
router.post('/superadmin/create-rooms', async (req, res) => {
  const { blockName, rooms } = req.body;

  if (!blockName || !rooms || !Array.isArray(rooms)) {
    return res.status(400).json({ message: 'Incomplete room data received' });
  }

  try {
    // ✅ Ensure all rooms include allocatedBeds = 0
    const roomsWithAllocation = rooms.map(room => ({
      ...room,
      allocatedBeds: room.allocatedBeds ?? 0  // default to 0 if not present
    }));

    // ✅ Check for duplicates in DB before insert
    const existingRooms = await Room.find({ blockName });
    const existingRoomNames = new Set(existingRooms.map(r => r.roomName));

    const duplicates = roomsWithAllocation.filter(room => existingRoomNames.has(room.roomName));
    if (duplicates.length > 0) {
      return res.status(400).json({
        message: `Duplicate room name(s) found in this block: ${duplicates.map(r => r.roomName).join(', ')}`
      });
    }

    // ✅ Save to Room collection
    await Room.insertMany(roomsWithAllocation);

    // ✅ Group rooms by type
    const grouped = {};
    roomsWithAllocation.forEach(room => {
      if (!grouped[room.roomType]) grouped[room.roomType] = [];
      grouped[room.roomType].push(room);
    });

    // ✅ Format blockTypeDetails for Block model
    const blockTypeDetails = Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length,
      rooms: grouped[type]
    }));

    // ✅ Save rooms to the Block document as well
    await Block.findOneAndUpdate(
      { blockName },
      {
        $set: {
          blockTypeDetails,
          createdRooms: roomsWithAllocation
        }
      },
      { new: true, upsert: true }
    );

    // ✅ Build summary for response
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

    // ✅ Catch MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || {}).join(', ');
      return res.status(400).json({
        message: `Duplicate room name in the same block: ${duplicateField}`
      });
    }

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
