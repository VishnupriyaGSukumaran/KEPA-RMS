const express = require('express');
const router = express.Router();
const Block = require('../models/Block'); // make sure it's imported
const Room = require('../models/Room'); // ✅ Add this line


router.post('/superadmin/create-rooms', async (req, res) => {
  const { blockName, rooms } = req.body;

    // If using Block model only (nested rooms), insert into that model instead
  if (!blockName || !rooms || !Array.isArray(rooms)) {
    return res.status(400).json({ message: 'Incomplete room data received' });
  }

  try {
    // 1. Save rooms in Room collection
    await Room.insertMany(rooms);

    // 2. Group by roomType
    const grouped = {};
    rooms.forEach(room => {
      if (!grouped[room.roomType]) {
        grouped[room.roomType] = [];
      }
      grouped[room.roomType].push(room);
    });

    // 3. Prepare block update object
    const blockTypeDetails = Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length,
      rooms: grouped[type]
    }));

    // 4. Update Block
    await Block.findOneAndUpdate(
      { blockName },
      { $set: { blockTypeDetails } },
      { new: true, upsert: true } // create if not exists
    );

    // 5. Prepare summary response
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



module.exports = router;
