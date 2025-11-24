const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room'); // Room model for deletion
const Account = require('../models/Account');
const RoomAllocation = require('../models/RoomAllocation');

// Helper: Convert to Title Case
function toTitleCase(input) {
  return input
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

// Create Block
// Create Block
router.post('/', async (req, res) => {
  let { blockName, blockTypes, roomCounts } = req.body;

  if (!blockName || !blockTypes || blockTypes.length === 0) {
    return res.status(400).json({ message: 'Block name and at least one block type are required.' });
  }

  blockName = blockName.trim();
  if (/^[A-Za-z]$/.test(blockName)) {
    blockName = `${blockName} Block`;
  }

  const normalizedBlockName = toTitleCase(blockName); // e.g. "A Block"

  // Validate room counts
  for (const type of blockTypes) {
    const count = roomCounts[type];
    if (typeof count !== 'number' || isNaN(count) || count < 0) {
      return res.status(400).json({ message: `Invalid or missing room count for "${type}".` });
    }
  }

  try {
    // Check for existing block (case-insensitive)
    const existingBlock = await Block.findOne({
      blockName: { $regex: `^${normalizedBlockName}$`, $options: 'i' }
    });

    if (existingBlock) {
      return res.status(409).json({ message: `Block "${normalizedBlockName}" already exists.` });
    }

    // --- Fetch matching rooms from request body ---
    const createdRooms = req.body.createdRooms || [];

    // ✅ Insert into DB and capture inserted rooms with `_id`
    const insertedRooms = await Room.insertMany(createdRooms);

    // ✅ Group by roomType using insertedRooms (not createdRooms)
    const groupedRooms = {};
    insertedRooms.forEach(room => {
      if (!groupedRooms[room.roomType]) groupedRooms[room.roomType] = [];
      groupedRooms[room.roomType].push(room);
    });

    // ✅ Build blockTypeDetails using insertedRooms
    const blockTypeDetails = blockTypes.map(type => ({
      type,
      count: roomCounts[type],
      rooms: groupedRooms[type] || []
    }));

    // ✅ Save new block with embedded room data (with valid `_id`)
    const newBlock = new Block({
      blockName: normalizedBlockName,
      blockTypes,
      roomCounts,
      blockTypeDetails,
      createdRooms: insertedRooms
    });

    await newBlock.save();

    res.status(201).json({ message: 'Block and room details saved successfully.' });
  } catch (error) {
    console.error('Error saving block:', error);
    res.status(500).json({ message: 'Server error. Could not save block.' });
  }
});


// In your block.js routes, update the get blocks endpoint:
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all blocks...'); // Debug log
    const blocks = await Block.find().lean();
    console.log('Blocks found:', blocks.length); // Debug log
    res.status(200).json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ message: 'Server error. Could not retrieve blocks.' });
  }
});


// ===== Get Block by Name (with stats) =====
router.get('/name/:blockName', async (req, res) => {
  const rawName = req.params.blockName.replace(/%20/g, ' ');
  const formattedBlockName = toTitleCase(rawName);
  
  console.log(`[BLOCK API] Requested blockName: "${rawName}" -> Formatted: "${formattedBlockName}"`);

  try {
    const block = await Block.findOne({
      blockName: { $regex: `^${formattedBlockName}$`, $options: 'i' }
    });

    if (!block) {
      console.log(`[BLOCK API] Block not found for: "${formattedBlockName}"`);
      return res.status(404).json({ message: 'Block not found' });
    }

    console.log(`[BLOCK API] Block found: "${block.blockName}"`);

    // ✅ ALWAYS fetch fresh room data from Room collection (not from Block document)
    let rooms = await Room.find({ 
      blockName: { $regex: `^${block.blockName}$`, $options: 'i' }
    }).lean(); // Use .lean() for better performance
    
    console.log(`[BLOCK API] Querying rooms with blockName: "${block.blockName}"`);
    console.log(`[BLOCK API] Found ${rooms.length} rooms`);

    // ✅ Ensure room bed statuses reflect the latest allocations
    const allocations = await RoomAllocation.find({
      blockName: { $regex: `^${block.blockName}$`, $options: 'i' }
    }).lean();

    const allocationsByRoom = allocations.reduce((acc, allocation) => {
      if (!allocation.roomNumber) return acc;
      acc[allocation.roomNumber] = acc[allocation.roomNumber] || [];
      acc[allocation.roomNumber].push(allocation);
      return acc;
    }, {});

    const roomsNeedingUpdate = [];

    rooms = rooms.map((room) => {
      const bedCount = room.beds?.length || room.bedCount || 0;
      let beds = Array.from({ length: bedCount }, (_, idx) => ({
        bedNumber: room.beds?.[idx]?.bedNumber || idx + 1,
        status: 'vacant',
        occupantName: null
      }));

      const roomAllocations = allocationsByRoom[room.roomName] || [];
      roomAllocations.forEach((allocation) => {
        const idx = Number(allocation.bedIndex);
        if (!Number.isNaN(idx) && beds[idx]) {
          beds[idx].status = 'allocated';
          beds[idx].occupantName = allocation.name || null;
        } else {
          const firstVacant = beds.find(bed => bed.status === 'vacant');
          if (firstVacant) {
            firstVacant.status = 'allocated';
            firstVacant.occupantName = allocation.name || null;
          }
        }
      });

      const allocatedBedsCount = beds.filter(bed => bed.status === 'allocated').length;

      const needsPersist =
        JSON.stringify(room.beds ?? []) !== JSON.stringify(beds) ||
        (room.allocatedBeds || 0) !== allocatedBedsCount;

      if (needsPersist) {
        roomsNeedingUpdate.push({
          _id: room._id,
          beds,
          allocatedBeds: allocatedBedsCount
        });
      }

      return {
        ...room,
        beds,
        allocatedBeds: allocatedBedsCount
      };
    });

    if (roomsNeedingUpdate.length) {
      await Promise.all(
        roomsNeedingUpdate.map((roomUpdate) =>
          Room.updateOne(
            { _id: roomUpdate._id },
            { beds: roomUpdate.beds, allocatedBeds: roomUpdate.allocatedBeds }
          )
        )
      );
    }

    // ✅ Calculate REAL-TIME stats from actual Room documents
    let totalBeds = 0;
    let vacantBeds = 0;

    rooms.forEach(room => {
      const roomTotal = room.beds?.length || room.bedCount || 0;
      let roomVacant = 0;
      
      if (room.beds && Array.isArray(room.beds)) {
        roomVacant = room.beds.filter(b => b.status === 'vacant').length;
      } else {
        roomVacant = roomTotal - (room.allocatedBeds || 0);
      }
      
      totalBeds += roomTotal;
      vacantBeds += roomVacant;
      
      console.log(`  Room ${room.roomName}: ${roomTotal} total, ${roomVacant} vacant, ${roomTotal - roomVacant} allocated`);
    });

    const roomTypeCounts = rooms.reduce((acc, room) => {
      const type = room.roomType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const totalRooms = rooms.length;
    const dormitories = roomTypeCounts['Dormitory'] || 0;

    // Debug logging
    console.log(`[BLOCK STATS] Block: "${block.blockName}"`);
    console.log(`[BLOCK STATS] Rooms found: ${rooms.length}`);
    console.log(`[BLOCK STATS] Total Beds: ${totalBeds}, Vacant: ${vacantBeds}, Occupied: ${totalBeds - vacantBeds}`);
    console.log(`[BLOCK STATS] Room Types:`, roomTypeCounts);

    // ✅ Update Block document with fresh stats
    block.totalBeds = totalBeds;
    block.vacantBeds = vacantBeds;
    await block.save();

    // ✅ CRITICAL FIX: Return fresh rooms data, NOT block.createdRooms
    res.status(200).json({
      _id: block._id,
      blockName: block.blockName,
      totalRooms,
      totalBeds,
      vacantBeds,
      dormitories,
      roomTypeCounts,
      blockTypes: block.blockTypes,
      blockTypeDetails: block.blockTypeDetails,
      createdRooms: rooms  // ✅ Return fresh room data from Room collection, NOT block.createdRooms
    });
  } catch (err) {
    console.error('Error fetching block by name:', err);
    res.status(500).json({ message: 'Server error' });
  }
});







// Get a specific block by ID
router.get('/:id', async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});





// Delete a block and associated rooms
// ===== Delete Block, Rooms, and Unassign BlockHeads =====
router.delete('/:id', async (req, res) => {
  try {
    // Step 1: Find the block
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Step 2: Delete all associated rooms from the Room collection
    await Room.deleteMany({ blockName: block.blockName });


    // Unassign block from blockhead users instead of deleting them
    const updatedUsers = await Account.updateMany(
      {
        userType: 'blockhead',
        assignedBlock: { $regex: `^${blockName}$`, $options: 'i' }
      },
      { $unset: { assignedBlock: "" } }
    );     


    // Step 3: Delete the block
    await Block.findByIdAndDelete(req.params.id);

    res.json({
      message: `Block and associated rooms deleted successfully. ${updatedUsers.modifiedCount} blockhead(s) unassigned.`
    });
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

    // Delete all rooms associated with the block

    await Room.deleteMany({
      blockName: new RegExp(`^${blockName}$`, 'i'),
      roomType: new RegExp(`^${type}$`, 'i')
    });
    // await Room.deleteMany({ blockName });

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

    res.json({
      message: `Block and associated rooms deleted successfully. ${updatedUsers.modifiedCount} blockhead(s) unassigned.`
    });
  } catch (error) {
    console.error('Error deleting block and related data:', error);
    res.status(500).json({ message: 'Failed to delete block and associated data' });
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

    const normalizedNewType = newType.trim();
    const normalizedOldType = type.trim().toLowerCase();

    // Check for duplicate type names
    if (block.blockTypes.some(bt => 
      bt.trim().toLowerCase() !== normalizedOldType && 
      bt.trim().toLowerCase() === normalizedNewType.toLowerCase()
    )) {
      return res.status(400).json({ message: 'Room type already exists' });
    }

    // Update rooms
    await Room.updateMany(
      { blockName: block.blockName, roomType: type },
      { $set: { roomType: normalizedNewType } }
    );

    // Update block data
    block.blockTypeDetails = block.blockTypeDetails.map(bt => 
      bt.type === type ? { ...bt, type: normalizedNewType, count } : bt
    );

    block.blockTypes = block.blockTypes.map(bt => 
      bt === type ? normalizedNewType : bt
    );

    // Update counts
    block.roomCounts = {};
    block.blockTypeDetails.forEach(detail => {
      block.roomCounts[detail.type] = detail.count;
    });

    await block.save();

    res.status(200).json({
      message: `Room type updated successfully`,
      updatedBlock: block
    });
  } catch (err) {
    console.error('Error updating room type:', err);
    res.status(500).json({ message: 'Failed to update room type' });
  }
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



// Prevent room count modifications
router.put('/:id/counts', async (req, res) => {
  res.status(403).json({ message: 'Room count modification is not allowed after creation.' });
});

module.exports = router;
