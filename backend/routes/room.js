const express = require('express');
const router = express.Router();
const Block = require('../models/Block'); // make sure it's imported
const Room = require('../models/Room'); // ✅ Add this line
// At the TOP of room.js file, make sure you have:
const RoomAllocation = require('../models/RoomAllocation');

// ✅ FIXED: routes/room.js - POST /superadmin/create-rooms
// This handles the case where Block API already inserted rooms

// ========================================
// COMPLETE FIX FOR routes/room.js
// POST /superadmin/create-rooms
// ========================================
// ========================================
// FIXED: routes/room.js - POST /superadmin/create-rooms
// This handles BOTH initial creation AND adding rooms to existing block types
// ========================================

router.post('/superadmin/create-rooms', async (req, res) => {
  const { blockName, rooms } = req.body;

  if (!blockName || !rooms || !Array.isArray(rooms)) {
    return res.status(400).json({ message: 'Incomplete room data received' });
  }

  console.log(`\n🔄 Creating rooms for block: ${blockName}`);
  console.log(`📦 Rooms to create: ${rooms.length}`);

  try {
    // ✅ Ensure all rooms include allocatedBeds = 0
    const roomsWithAllocation = rooms.map(room => ({
      ...room,
      allocatedBeds: room.allocatedBeds ?? 0
    }));

    // ✅ Check if rooms already exist (to avoid duplicates)
    const existingRooms = await Room.find({ 
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    });
    
    const existingRoomNames = new Set(existingRooms.map(r => r.roomName));

    // ✅ Filter out rooms that already exist
    const newRooms = roomsWithAllocation.filter(room => !existingRoomNames.has(room.roomName));

    console.log(`📊 Existing rooms: ${existingRooms.length}, New rooms to insert: ${newRooms.length}`);

    let insertedRooms = [];

    // ✅ Only insert if there are new rooms
    if (newRooms.length > 0) {
      try {
        insertedRooms = await Room.insertMany(newRooms);
        console.log(`✅ Inserted ${insertedRooms.length} new rooms`);
      } catch (insertError) {
        console.error('Error inserting rooms:', insertError);
        
        // Handle duplicate key error
        if (insertError.code === 11000) {
          const duplicateField = Object.keys(insertError.keyValue || {}).join(', ');
          return res.status(400).json({
            message: `Duplicate room name in the same block: ${duplicateField}`
          });
        }
        throw insertError;
      }
    } else {
      console.log(`ℹ️ All rooms already exist, no new rooms to insert`);
    }

    // ✅ CRITICAL FIX: Fetch ALL rooms for this block (existing + new)
    const allRooms = await Room.find({ 
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    });

    console.log(`📋 Total rooms in database: ${allRooms.length}`);

    // ✅ Group ALL rooms by roomType
    const roomsByType = {};
    allRooms.forEach(room => {
      const type = room.roomType || 'Unknown';
      if (!roomsByType[type]) roomsByType[type] = [];
      roomsByType[type].push(room);
    });

    console.log(`📊 Room types:`, Object.keys(roomsByType).map(type => `${type}(${roomsByType[type].length})`).join(', '));

    // ✅ Build complete blockTypeDetails from ALL rooms
    const blockTypeDetails = Object.keys(roomsByType).map(type => ({
      type,
      count: roomsByType[type].length,
      rooms: roomsByType[type].map(room => ({
        _id: room._id,
        roomName: room.roomName,
        roomType: room.roomType,
        isAC: room.isAC,
        attachedBathroom: room.attachedBathroom,
        floorNumber: room.floorNumber,
        bedCount: room.bedCount,
        allocatedBeds: room.allocatedBeds || 0,
        additionalFacilities: room.additionalFacilities
      }))
    }));

    // ✅ CRITICAL FIX: Find block and update with COMPLETE room data
    const block = await Block.findOne({ 
      blockName: { $regex: `^${blockName}$`, $options: 'i' } 
    });

    if (!block) {
      console.error(`❌ Block not found: ${blockName}`);
      return res.status(404).json({ message: 'Block not found' });
    }

    // ✅ Update Block document with COMPLETE blockTypeDetails
    // This REPLACES the old blockTypeDetails entirely
    block.blockTypeDetails = blockTypeDetails;
    block.blockTypes = blockTypeDetails.map(d => d.type);
    block.roomCounts = blockTypeDetails.reduce((acc, detail) => {
      acc[detail.type] = detail.count;
      return acc;
    }, {});

    await block.save();

    console.log(`✅ Block document updated successfully`);
    console.log(`   Block types now: ${block.blockTypes.join(', ')}`);
    console.log(`   Room counts: ${JSON.stringify(block.roomCounts)}`);

    // ✅ Prepare summary response
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

    return res.status(200).json({ 
      message: 'Rooms saved successfully', 
      summary, 
      blockTypeDetails,
      roomsInserted: newRooms.length,
      roomsExisting: existingRooms.length,
      totalRooms: allRooms.length
    });

  } catch (error) {
    console.error('❌ Error saving rooms:', error);

    // ✅ Catch MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || {}).join(', ');
      return res.status(400).json({
        message: `Duplicate room name in the same block: ${duplicateField}`
      });
    }

    return res.status(500).json({ 
      message: 'Server error while saving room data',
      error: error.message 
    });
  }
});
// Get rooms by block and type
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

    // ✅ CRITICAL FIX: Fetch rooms first
    const rooms = await Room.find({
      blockName: block.blockName,
      roomType: roomType
    }).lean();

    // ✅ CRITICAL FIX: Fetch allocations
    const allocations = await RoomAllocation.find({
      blockName: { $regex: `^${block.blockName}$`, $options: 'i' }
    }).lean();

    // ✅ Group allocations by room
    const allocationsByRoom = allocations.reduce((acc, allocation) => {
      if (!allocation.roomNumber) return acc;
      acc[allocation.roomNumber] = acc[allocation.roomNumber] || [];
      acc[allocation.roomNumber].push(allocation);
      return acc;
    }, {});

    // ✅ Update each room with real allocation data
    const updatedRooms = rooms.map(room => {
      const bedCount = room.beds?.length || room.bedCount || 0;
      let beds = Array.from({ length: bedCount }, (_, idx) => ({
        bedNumber: room.beds?.[idx]?.bedNumber || idx + 1,
        status: 'vacant',
        occupantName: null
      }));

      // Apply allocations
      const roomAllocations = allocationsByRoom[room.roomName] || [];
      roomAllocations.forEach((allocation) => {
        const idx = Number(allocation.bedIndex);
        if (!Number.isNaN(idx) && beds[idx]) {
          beds[idx].status = 'allocated';
          beds[idx].occupantName = allocation.name || null;
        }
      });

      const allocatedBedsCount = beds.filter(bed => bed.status === 'allocated').length;

      return {
        ...room,
        beds,
        allocatedBeds: allocatedBedsCount
      };
    });

    console.log(`✅ Returning ${updatedRooms.length} rooms with fresh allocation data`);

    res.status(200).json(updatedRooms); // ✅ Return updatedRooms instead of rooms
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
       // ✅ Update room counts
      block.roomCounts[roomType] = blockTypeDetail.count;
      await block.save();
    }

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Server error while deleting room' });
  }
});


// ✅ CRITICAL FIX: Update room with immediate refresh
router.put('/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const {
    blockId,
    roomType,
    roomName,
    floorNumber,
    bedCount,
    isAC,
    attachedBathroom,
    additionalFacilities
  } = req.body;

  try {
    console.log(`🔄 Updating room ${roomId}...`);

    // ✅ Fetch the room before update to compare bedCount
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const oldBedCount = existingRoom.bedCount || 0;
    const newBedCount = parseInt(bedCount) || 0;

    // ✅ Prepare updated bed array if bedCount changed
    let updatedBeds = existingRoom.beds || [];
    
    if (newBedCount !== oldBedCount) {
      console.log(`📊 Bed count changing from ${oldBedCount} to ${newBedCount}`);
      
      // Get current allocations for this room
      const allocations = await RoomAllocation.find({
        blockName: existingRoom.blockName,
        roomNumber: existingRoom.roomName
      });

      // Create new bed array
      updatedBeds = Array.from({ length: newBedCount }, (_, idx) => ({
        bedNumber: idx + 1,
        status: 'vacant',
        occupantName: null
      }));

      // Apply existing allocations
      allocations.forEach(allocation => {
        const idx = Number(allocation.bedIndex);
        if (!Number.isNaN(idx) && updatedBeds[idx]) {
          updatedBeds[idx].status = 'allocated';
          updatedBeds[idx].occupantName = allocation.name || null;
        }
      });
    }

    const allocatedCount = updatedBeds.filter(b => b.status === 'allocated').length;

    // ✅ Update room with new bed array
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        roomName,
        floorNumber,
        bedCount: newBedCount,
        isAC,
        attachedBathroom,
        additionalFacilities,
        beds: updatedBeds,
        allocatedBeds: allocatedCount
      },
      { new: true }
    );

    console.log(`✅ Room updated: ${updatedRoom.roomName}, Beds: ${newBedCount}, Allocated: ${allocatedCount}`);

    // ✅ Update block document if blockId provided
    if (blockId) {
      const block = await Block.findById(blockId);
      if (block) {
        const detail = block.blockTypeDetails.find(d => d.type === roomType);
        if (detail) {
          const roomIndex = detail.rooms.findIndex(r => {
            return r._id && r._id.toString() === roomId;
          });

          if (roomIndex !== -1) {
            detail.rooms[roomIndex] = {
              ...detail.rooms[roomIndex],
              roomName,
              floorNumber,
              bedCount: newBedCount,
              isAC,
              attachedBathroom,
              additionalFacilities
            };
            await block.save();
            console.log(`✅ Block document updated`);
          }
        }
      }
    }

    res.status(200).json({ 
      message: 'Room updated successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Failed to update room' });
  }
});


// 
// ✅ ADD THESE TO routes/room.js


// PASTE THESE ROUTES BEFORE module.exports = router;

// ===== GET Room Allocation Status =====
router.get('/allocation-info/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log(`\n✅ ALLOCATION-INFO REQUEST for room ID: ${roomId}`);
    
    // Find the room
    const room = await Room.findById(roomId);
    
    if (!room) {
      console.log(`❌ Room not found: ${roomId}`);
      return res.status(404).json({ 
        message: 'Room not found',
        allocatedBeds: 0,
        bedCount: 0,
        status: 'Vacant'
      });
    }

    console.log(`📌 Found room: ${room.roomName} in block: ${room.blockName}`);
    console.log(`📊 Room has ${room.bedCount} beds`);

    // Query RoomAllocation collection
    const allocations = await RoomAllocation.find({
      blockName: room.blockName,
      roomNumber: room.roomName
    });

    console.log(`🔍 Found ${allocations.length} allocations in RoomAllocation`);
    
    if (allocations.length > 0) {
      allocations.forEach((alloc, idx) => {
        console.log(`   ${idx + 1}. ${alloc.name || 'Unknown'} - Bed ${alloc.bedIndex || 'N/A'}`);
      });
    }

    // Calculate stats
    const bedCount = room.bedCount || 0;
    const allocatedBeds = allocations.length;
    const vacantBeds = bedCount - allocatedBeds;

    // Determine status
    let status = 'Vacant';
    if (allocatedBeds > 0 && allocatedBeds < bedCount) {
      status = 'Partially Allocated';
    } else if (allocatedBeds >= bedCount && bedCount > 0) {
      status = 'Fully Allocated';
    }

    console.log(`✅ Status: ${status} (${allocatedBeds}/${bedCount} beds)`);

    const response = {
      roomId: room._id,
      roomName: room.roomName,
      blockName: room.blockName,
      bedCount: bedCount,
      allocatedBeds: allocatedBeds,
      vacantBeds: vacantBeds,
      status: status,
      isFullyOccupied: allocatedBeds >= bedCount,
      canEdit: allocatedBeds === 0,
      canDelete: allocatedBeds === 0
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in allocation-info:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      allocatedBeds: 0,
      bedCount: 0,
      status: 'Vacant'
    });
  }
});

// ===== ALTERNATIVE: GET Room Info (exact same logic) =====
router.get('/info/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log(`\n✅ INFO REQUEST for room ID: ${roomId}`);
    
    const room = await Room.findById(roomId);
    
    if (!room) {
      console.log(`❌ Room not found: ${roomId}`);
      return res.status(404).json({ 
        message: 'Room not found',
        allocatedBeds: 0,
        bedCount: 0,
        status: 'Vacant'
      });
    }

    console.log(`📌 Found room: ${room.roomName}`);

    const allocations = await RoomAllocation.find({
      blockName: room.blockName,
      roomNumber: room.roomName
    });

    console.log(`🔍 Allocations: ${allocations.length}`);

    const bedCount = room.bedCount || 0;
    const allocatedBeds = allocations.length;
    const vacantBeds = bedCount - allocatedBeds;

    let status = 'Vacant';
    if (allocatedBeds > 0 && allocatedBeds < bedCount) {
      status = 'Partially Allocated';
    } else if (allocatedBeds >= bedCount && bedCount > 0) {
      status = 'Fully Allocated';
    }

    const response = {
      roomId: room._id,
      roomName: room.roomName,
      bedCount: bedCount,
      allocatedBeds: allocatedBeds,
      vacantBeds: vacantBeds,
      status: status,
      isFullyOccupied: allocatedBeds >= bedCount,
      canEdit: allocatedBeds === 0,
      canDelete: allocatedBeds === 0
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in info route:', error);
    res.status(500).json({ 
      message: 'Server error',
      allocatedBeds: 0,
      bedCount: 0,
      status: 'Vacant'
    });
  }
});

// Make sure module.exports is at the END:
// module.exports = router;





module.exports = router;
