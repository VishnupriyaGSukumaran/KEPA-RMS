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

    // ✅ Save to Room collection
    await Room.insertMany(roomsWithAllocation);

    // 2. Group by roomType
   const grouped = {};
  roomsWithAllocation.forEach(room => {
   if (!grouped[room.roomType]) {
    grouped[room.roomType] = [];
   }
   grouped[room.roomType].push(room);
   });
    // 3. Prepare block update object
    const blockTypeDetails = Object.keys(grouped).map(type => ({
      type,
      count: grouped[type].length,
      rooms: grouped[type].map(room => ({
  _id: room._id,
  roomName: room.roomName,
  roomType: room.roomType,
  isAC: room.isAC,
  attachedBathroom: room.attachedBathroom,
  floorNumber: room.floorNumber,
  bedCount: room.bedCount,
  additionalFacilities: room.additionalFacilities
}))

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

    return res.status(200).json({ message: 'Rooms saved successfully', summary ,  blockTypeDetails });
  } catch (error) {
    console.error('Error saving rooms:', error);
    return res.status(500).json({ message: 'Server error while saving room data' });
  }
});


// PUT /api/room/:roomId
router.put('/:id', async (req, res) => {
  const roomId = req.params.roomId;
  const {
    roomName,
    floorNumber,
    bedCount,
    isAC,
    attachedBathroom,
    additionalFacilities
  } = req.body;

  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        roomName,
        floorNumber,
        bedCount,
        isAC,
        attachedBathroom,
        additionalFacilities
      },
      { new: true } // return updated doc
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Optional: Also update it inside the Block model (embedded data)
    const block = await Block.findOne({ blockName: updatedRoom.blockName });
    if (block) {
      const detail = block.blockTypeDetails.find(d => d.type === updatedRoom.roomType);
      if (detail) {
      const roomIndex = detail.rooms.findIndex(r => {return r._id && r._id.toString() === roomId;});

        if (roomIndex !== -1) {
          detail.rooms[roomIndex] = { ...detail.rooms[roomIndex]._doc, ...req.body };
          await block.save();
        }
      }
    }

    res.status(200).json({ message: 'Room updated successfully' });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Failed to update room' });
  }
});


module.exports = router;
