// ✅ File: routes/roomAllocationRoutes.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const Room = require('../models/Room'); // ✅ import Room model

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

    // ✅ Create allocation record
    const newAllocation = new RoomAllocation({
      ...data,
      block: data.blockName
    });
    await newAllocation.save();

    // ✅ Update Room document — handle individual bed status
    const room = await Room.findOne({ blockName: data.blockName, roomName: data.roomNumber });

    if (room) {
      // Ensure bed array exists
      if (!room.beds) {
        room.beds = Array.from({ length: room.bedCount || 0 }, (_, i) => ({
          bedNumber: i + 1,
          status: 'vacant',
          occupantName: null,
        }));
      }

      const bedIndex = data.bedIndex;
      if (room.beds[bedIndex]) {
        room.beds[bedIndex].status = 'allocated';
        room.beds[bedIndex].occupantName = data.name || null;
      }

      // Update allocatedBeds count safely
      room.allocatedBeds = room.beds.filter(b => b.status === 'allocated').length;

      await room.save();
    }

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

/// ✅ Vacate allocation — free bed & update status and block counts
router.delete('/:id', async (req, res) => {
  try {
    const allocation = await RoomAllocation.findByIdAndDelete(req.params.id);

    if (allocation) {
      const room = await Room.findOne({
        blockName: allocation.blockName,
        roomName: allocation.roomNumber,
      });

      if (room && Array.isArray(room.beds)) {
        // Find bed occupied by this person
        const bed = room.beds.find(
          (b) => b.occupantName === allocation.name && b.status === 'allocated'
        );

        if (bed) {
          bed.status = 'vacant';
          bed.occupantName = null;
        }

        // Recalculate allocated count
        room.allocatedBeds = room.beds.filter((b) => b.status === 'allocated').length;

        await room.save();
      }

      // ✅ Update block vacant beds count (to reflect on top cards)
      const Block = require('../models/Block');
      const block = await Block.findOne({ blockName: allocation.blockName });
      if (block) {
        // recalculate from all rooms
        const allRooms = await Room.find({ blockName: block.blockName });
        const totalBeds = allRooms.reduce(
          (sum, r) => sum + (r.bedCount || 0),
          0
        );
        const vacantBeds = allRooms.reduce(
          (sum, r) => sum + (r.beds?.filter((b) => b.status === 'vacant').length || 0),
          0
        );

        block.totalBeds = totalBeds;
        block.vacantBeds = vacantBeds;
        await block.save();
      }
    }

    res.status(200).json({ success: true, message: 'Room vacated successfully.' });
  } catch (err) {
    console.error('Vacate error:', err);
    res.status(500).json({ error: 'Failed to vacate room.' });
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
