// ✅ File: routes/roomAllocationRoutes.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const Room = require('../models/Room'); // ✅ import Room model
const Block = require('../models/Block');
const VacatingRecord = require('../models/VacatingRecord'); // ✅ IMPORT THIS
// ---------------------------------------------
// Helper utilities to keep Room + Block in sync
// ---------------------------------------------
async function syncRoomBeds(blockName, roomNumber) {
  const room = await Room.findOne({
    blockName: { $regex: `^${blockName}$`, $options: 'i' },
    roomName: roomNumber
  });

  if (!room) {
    console.log('⚠️ syncRoomBeds: Room not found for', blockName, roomNumber);
    return null;
  }

  const bedCount = room.bedCount || room.beds?.length || 0;
  if (bedCount === 0) {
    return room;
  }

  // Ensure bed array exists and matches bedCount
  if (!room.beds || room.beds.length !== bedCount) {
    room.beds = Array.from({ length: bedCount }, (_, i) => ({
      bedNumber: i + 1,
      status: 'vacant',
      occupantName: null
    }));
  } else {
    room.beds = room.beds.map((bed, idx) => ({
      bedNumber: bed?.bedNumber || idx + 1,
      status: 'vacant',
      occupantName: null
    }));
  }

  // Fetch active allocations for this room
  const allocations = await RoomAllocation.find({
    blockName: { $regex: `^${blockName}$`, $options: 'i' },
    roomNumber
  });

  allocations.forEach(allocation => {
    const idx = Number(allocation.bedIndex);
    if (!Number.isNaN(idx) && room.beds[idx]) {
      room.beds[idx].status = 'allocated';
      room.beds[idx].occupantName = allocation.name || null;
    } else {
      const vacantBed = room.beds.find(b => b.status === 'vacant');
      if (vacantBed) {
        vacantBed.status = 'allocated';
        vacantBed.occupantName = allocation.name || null;
      }
    }
  });

  room.allocatedBeds = room.beds.filter(b => b.status === 'allocated').length;
  room.markModified('beds');
  await room.save();
  return room;
}

async function syncBlockStats(blockName) {
  const block = await Block.findOne({
    blockName: { $regex: `^${blockName}$`, $options: 'i' }
  });

  if (!block) {
    console.log('⚠️ syncBlockStats: Block not found for', blockName);
    return;
  }

  const rooms = await Room.find({
    blockName: { $regex: `^${blockName}$`, $options: 'i' }
  });

  let totalBeds = 0;
  let vacantBeds = 0;

  rooms.forEach(room => {
    const roomTotal = room.beds?.length || room.bedCount || 0;
    const roomVacant = room.beds?.filter(b => b.status === 'vacant').length
      ?? (roomTotal - (room.allocatedBeds || 0));

    totalBeds += roomTotal;
    vacantBeds += roomVacant;
  });

  block.totalBeds = totalBeds;
  block.vacantBeds = vacantBeds;
  await block.save();
}

// ✅ Allocate Room / Bed
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (!data.blockName || !data.allocatedBy) {
      return res.status(400).json({ error: 'Block name and Allocator name are required.' });
    }

    // ✅ Duplicate check
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

    // ✅ Create allocation record - EXPLICITLY include bedIndex and blockName
    const newAllocation = new RoomAllocation({
      ...data,
      block: data.blockName,
      blockName: data.blockName, // ✅ Ensure blockName is saved
      bedIndex: data.bedIndex    // ✅ Explicitly save bedIndex
    });
    
    console.log('💾 Saving allocation with bedIndex:', data.bedIndex); // Debug log
    await newAllocation.save();

    // ✅ Re-sync room beds + block statistics to ensure UI accuracy
    await syncRoomBeds(data.blockName, data.roomNumber);
    await syncBlockStats(data.blockName);

    res.status(201).json({
      success: true,
      message: 'Room allocated successfully.',
      allocation: newAllocation,
    });
  } catch (err) {
    console.error('Allocation Error:', err);
    res.status(500).json({ error: 'Failed to allocate room.' });
  }
});

// ✅ Fetch allocated person
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





























// ✅✅✅ VACATE ALLOCATION - AUTOMATICALLY SAVE TO VACATING RECORDS FIRST
router.delete('/:id', async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('🔴 VACATE REQUEST RECEIVED - ID:', req.params.id);
    console.log('='.repeat(60));
    
    const allocation = await RoomAllocation.findById(req.params.id);
    
    if (!allocation) {
      console.log('❌ Allocation not found');
      return res.status(404).json({ error: 'Allocation not found.' });
    }

    console.log('📋 Found allocation:', {
      name: allocation.name,
      pen: allocation.pen,
      recruitmentNumber: allocation.recruitmentNumber,
      block: allocation.blockName,
      room: allocation.roomNumber,
      bedIndex: allocation.bedIndex
    });

    // ✅ STEP 1: CREATE VACATING RECORD BEFORE DELETING
    console.log('💾 Step 1: Creating vacating record...');
    
    const { vacatingDate, paid, vacatedBy } = req.body || {};
    
    const vacatingData = {
      // Person Details
      name: allocation.name,
      pen: allocation.pen || null,
      recruitmentNumber: allocation.recruitmentNumber || null,
      mobileNumber: allocation.mobileNumber,
      emergencyContact: allocation.emergencyContact,
      designation: allocation.designation,
      unit: allocation.unit,
      district: allocation.district,
      address: allocation.address,
      
      // Room Details
      roomNumber: allocation.roomNumber,
      block: allocation.blockName || allocation.block,
      blockName: allocation.blockName || allocation.block,
      bedIndex: allocation.bedIndex,
      trainingCompany: allocation.trainingCompany,
      
      // Allocation Details
      allocationDate: allocation.allocationDate,
      purpose: allocation.purpose,
      courseDetails: allocation.courseDetails,
      remark: allocation.remark,
      
      // Vacating Details
      vacatingDate: vacatingDate ? new Date(vacatingDate) : new Date(),
      paid: paid || 'No',
      vacatedBy: vacatedBy || 'System',
      originalAllocationId: allocation._id
    };

    console.log('📝 Vacating data to save:', JSON.stringify(vacatingData, null, 2));

    const vacatingRecord = new VacatingRecord(vacatingData);
    const savedVacatingRecord = await vacatingRecord.save();
    
    console.log('✅✅✅ VACATING RECORD SAVED SUCCESSFULLY!');
    console.log('📄 Saved Record ID:', savedVacatingRecord._id);
    console.log('📄 Record Details:', {
      name: savedVacatingRecord.name,
      pen: savedVacatingRecord.pen,
      recruitmentNumber: savedVacatingRecord.recruitmentNumber,
      room: savedVacatingRecord.roomNumber,
      block: savedVacatingRecord.blockName,
      vacatingDate: savedVacatingRecord.vacatingDate
    });

    // ✅ STEP 2: NOW DELETE THE ALLOCATION
    console.log('🗑️ Step 2: Deleting allocation from RoomAllocation...');
    const { blockName, roomNumber } = allocation;
    
    await RoomAllocation.findByIdAndDelete(req.params.id);
    console.log('✅ Allocation deleted from RoomAllocation collection');

    // ✅ STEP 3: SYNC ROOM AND BLOCK STATS
    await syncRoomBeds(blockName, roomNumber);
    await syncBlockStats(blockName);

    console.log('✅✅✅ VACATE PROCESS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    res.status(200).json({ 
      success: true, 
      message: 'Room vacated successfully and saved to vacating records.',
      vacatingRecordId: savedVacatingRecord._id
    });
    
  } catch (err) {
    console.log('='.repeat(60));
    console.error('❌❌❌ VACATE ERROR:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    console.log('='.repeat(60));
    res.status(500).json({ 
      error: 'Failed to vacate room.',
      details: err.message 
    });
  }
});

// ✅ Get all allocations for a specific block
router.get('/block/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    const Allocation = require('../models/allocationModel');

    const allocations = await Allocation.find({
      requestedBlock: decodeURIComponent(blockName)
    });

    if (!allocations.length) {
      return res.status(404).json({ message: `No allocations found for ${blockName}` });
    }

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations for block:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;
