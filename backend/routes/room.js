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
    const insertedRooms = await Room.insertMany(rooms);

    // 2. Group by roomType
   const grouped = {};
   insertedRooms.forEach(room => {
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

    return res.status(200).json({ message: 'Rooms saved successfully', summary ,  blockTypeDetails });
  } catch (error) {
    console.error('Error saving rooms:', error);
    return res.status(500).json({ message: 'Server error while saving room data' });
  }
});




// Get rooms by block and type
router.get('/', async (req, res) => {
  try {
    const { blockId, roomType } = req.query;
    if (!blockId || !roomType) {
      return res.status(400).json({ message: 'Block ID and room type are required' });
    }

    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    const rooms = await Room.find({
      blockName: block.blockName,
      roomType: roomType
    });

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error while fetching rooms' });
  }
});
router.put('/:blockId/type/:type', async (req, res) => {
  const { blockId, type } = req.params;
  const { newType, count } = req.body;

  if (!newType || !newType.trim()) {
    return res.status(400).json({ message: 'New type name is required' });
  }

  try {
    const block = await Block.findById(blockId);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    // Normalize all type names for consistent comparison
    const normalizeType = (t) => t.trim().replace(/\s+/g, '').toLowerCase();
    const currentNormalized = normalizeType(type);
    const newNormalized = normalizeType(newType);

    // Check for duplicates (case and space insensitive)
    const hasDuplicate = block.blockTypes.some(bt => 
      normalizeType(bt) !== currentNormalized && 
      normalizeType(bt) === newNormalized
    );

    if (hasDuplicate) {
      return res.status(400).json({ message: 'Room type already exists' });
    }

    // Get the properly formatted current type from block (respects enum values)
    const currentTypeInBlock = block.blockTypes.find(bt => 
      normalizeType(bt) === currentNormalized
    );

    if (!currentTypeInBlock) {
      return res.status(404).json({ message: 'Current room type not found in block' });
    }

    // Format new type according to enum values
    let formattedNewType = newType.trim();
    if (newNormalized === 'suiteroom') formattedNewType = 'Suite Room';
    if (newNormalized === 'barrack') formattedNewType = 'Barrack';
    if (newNormalized === 'dormitory') formattedNewType = 'Dormitory';
    if (newNormalized === 'room') formattedNewType = 'Room';

    // Update rooms - using original formatted type from block
    const updateResult = await Room.updateMany(
      { 
        blockName: block.blockName,
        roomType: currentTypeInBlock // Use the properly formatted type from block
      },
      { $set: { roomType: formattedNewType } }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn('No rooms were updated - check query parameters');
    }

    // Update block data using original formatted type
    block.blockTypeDetails = block.blockTypeDetails.map(bt => 
      normalizeType(bt.type) === currentNormalized 
        ? { ...bt, type: formattedNewType, count } 
        : bt
    );

    block.blockTypes = block.blockTypes.map(bt => 
      normalizeType(bt) === currentNormalized ? formattedNewType : bt
    );

    // Update counts
    block.roomCounts = {};
    block.blockTypeDetails.forEach(detail => {
      block.roomCounts[detail.type] = detail.count;
    });

    await block.save();

    res.status(200).json({
      message: `Room type updated successfully`,
      updatedBlock: block,
      roomsUpdated: updateResult.modifiedCount
    });
  } catch (err) {
    console.error('Error updating room type:', err);
    res.status(500).json({ message: 'Failed to update room type' });
  }
});

// Delete a room
router.delete('/:id', async (req, res) => {
  try {
    const { blockId, roomType } = req.body;
    if (!blockId || !roomType) {
      return res.status(400).json({ message: 'Block ID and room type are required' });
    }

    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Delete the room
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Update the block's reference
    const blockTypeDetail = block.blockTypeDetails.find(t => t.type === roomType);
    if (blockTypeDetail) {
      blockTypeDetail.rooms = blockTypeDetail.rooms.filter(r => r._id.toString() !== req.params.id);
      blockTypeDetail.count = blockTypeDetail.rooms.length;
      await block.save();
    }

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Server error while deleting room' });
  }
});

module.exports = router;
