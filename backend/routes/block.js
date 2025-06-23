const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room');

// Convert to "Title Case"
function toTitleCase(input) {
  return input
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== Create Block =====
router.post('/', async (req, res) => {
  let { blockName, blockTypes, roomCounts } = req.body;

  if (!blockName || !blockTypes || blockTypes.length === 0) {
    return res.status(400).json({ message: 'Block name and at least one block type are required.' });
  }

  blockName = blockName.trim();
  if (/^[A-Za-z]$/.test(blockName)) {
    blockName = `${blockName} Block`;
  }

  const normalizedBlockName = toTitleCase(blockName);

  // Validate room counts
  for (const type of blockTypes) {
    const count = roomCounts[type];
    if (typeof count !== 'number' || isNaN(count) || count < 0) {
      return res.status(400).json({ message: `Invalid or missing room count for "${type}".` });
    }
  }

  try {
    const existingBlock = await Block.findOne({
      blockName: { $regex: `^${normalizedBlockName}$`, $options: 'i' }
    });

    if (existingBlock) {
      return res.status(409).json({ message: `Block "${normalizedBlockName}" already exists.` });
    }

    const createdRooms = req.body.createdRooms || [];

    const groupedRooms = {};
    createdRooms.forEach(room => {
      if (!groupedRooms[room.roomType]) groupedRooms[room.roomType] = [];
      groupedRooms[room.roomType].push(room);
    });

    const blockTypeDetails = blockTypes.map(type => ({
      type,
      count: roomCounts[type],
      rooms: groupedRooms[type] || []
    }));

    const newBlock = new Block({
      blockName: normalizedBlockName,
      blockTypes,
      roomCounts,
      blockTypeDetails,
      createdRooms
    });

    await newBlock.save();

    res.status(201).json({ message: 'Block and room details saved successfully.' });
  } catch (error) {
    console.error('Error saving block:', error);
    res.status(500).json({ message: 'Server error. Could not save block.' });
  }
});

// ===== Get all Blocks =====
router.get('/', async (req, res) => {
  try {
    const blocks = await Block.find();
    res.status(200).json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ message: 'Server error. Could not retrieve blocks.' });
  }
});

// ✅ Updated: Get block statistics from Room collection
router.get('/name/:blockName', async (req, res) => {
  const rawName = req.params.blockName.replace(/%20/g, ' ');
  const formattedBlockName = toTitleCase(rawName);

  try {
    const block = await Block.findOne({
      blockName: { $regex: `^${formattedBlockName}$`, $options: 'i' }
    });

    if (!block) return res.status(404).json({ message: 'Block not found' });

    // 🟢 Get rooms from Room collection
    const rooms = await Room.find({ blockName: formattedBlockName });

    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + (room.bedCount || 0), 0);
    const vacantBeds = rooms.reduce((sum, room) => {
      const total = room.bedCount || 0;
      const allocated = room.allocatedBeds || 0;
      return sum + (total - allocated);
    }, 0);
    const dormitories = rooms.filter(r => r.roomType === 'Dormitory').length;

    res.status(200).json({
      blockName: block.blockName,
      totalRooms,
      totalBeds,
      vacantBeds,
      dormitories,
      blockTypes: block.blockTypes,
      blockTypeDetails: block.blockTypeDetails,
      createdRooms: rooms // ✅ Send rooms directly from DB
    });
  } catch (err) {
    console.error('Error fetching block by name:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ===== Delete a block and its rooms =====
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    await Room.deleteMany({ blockName: block.blockName });
    await Block.findByIdAndDelete(req.params.id);

    res.json({ message: 'Block and associated rooms deleted successfully' });
  } catch (error) {
    console.error('Error deleting block and rooms:', error);
    res.status(500).json({ message: 'Failed to delete block and associated rooms' });
  }
});







router.delete('/:blockId/type/:type', async (req, res) => {
  const { blockId, type } = req.params;

  try {
    const block = await Block.findById(blockId);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    const blockName = block.blockName;

    // Delete all rooms with matching roomType for this block
    await Room.deleteMany({
      blockName: new RegExp(`^${blockName}$`, 'i'),
      roomType: new RegExp(`^${type}$`, 'i')
    });

    // Remove from blockTypeDetails
    block.blockTypeDetails = block.blockTypeDetails.filter(
      (bt) => bt.type.trim().toLowerCase() !== type.trim().toLowerCase()
    );

    // Remove from blockTypes
    block.blockTypes = block.blockTypes.filter(
      (bt) => bt.trim().toLowerCase() !== type.trim().toLowerCase()
    );
 
   block.roomCounts = {}; // ← Plain JS object

block.blockTypeDetails.forEach(detail => {
  if (detail.type && typeof detail.count === 'number') {
    block.roomCounts[detail.type.trim()] = detail.count;
  }
});


// ✅ With the fixed version above


    await block.save();

    res.status(200).json({
      message: `Room type "${type}" and associated rooms removed successfully.`,
      updatedRoomCounts: block.roomCounts
    });
  } catch (err) {
    console.error('Error removing room type:', err);
    res.status(500).json({ message: 'Failed to remove room type and associated rooms' });
  }
});




// Prevent room count modifications
router.put('/:id/counts', async (req, res) => {
  res.status(403).json({ message: 'Room count modification is not allowed after creation.' });
});

// ===== Add Block Type to Existing Block =====
router.post('/:id/type', async (req, res) => {
  const { type } = req.body;

  if (!type) return res.status(400).json({ message: 'Block type is required' });

  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    const exists = block.blockTypeDetails.some(bt => bt.type === type);
    if (exists) return res.status(409).json({ message: 'Block type already exists' });

    block.blockTypes.push(type);
    block.roomCounts[type] = 0;
    block.blockTypeDetails.push({ type, count: 0, rooms: [] });

    await block.save();
    res.status(200).json({ message: 'Block type added successfully' });
  } catch (err) {
    console.error('Error adding block type:', err);
    res.status(500).json({ message: 'Server error while adding block type' });
  }
});

// ===== Delete Block Type from Block =====
router.delete('/:id/type/:type', async (req, res) => {
  const { id, type } = req.params;

  try {
    const block = await Block.findById(id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    const beforeLength = block.blockTypeDetails.length;

    block.blockTypeDetails = block.blockTypeDetails.filter(bt => bt.type !== type);
    block.blockTypes = block.blockTypes.filter(t => t !== type);
    delete block.roomCounts[type];

    if (block.blockTypeDetails.length === beforeLength) {
      return res.status(404).json({ message: 'Block type not found' });
    }

    await block.save();
    res.status(200).json({ message: 'Block type removed successfully' });
  } catch (err) {
    console.error('Error removing block type:', err);
    res.status(500).json({ message: 'Server error while removing block type' });
  }
});

module.exports = router;
