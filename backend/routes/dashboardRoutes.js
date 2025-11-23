const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Room = require('../models/Room');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total blocks
    const totalBlocks = await Block.countDocuments();

    // Get all rooms
    const rooms = await Room.find().lean();

    // Calculate statistics
    const totalRooms = rooms.length;
    
    let occupied = 0;
    let unoccupied = 0;
    let partiallyOccupied = 0;

    // Count rooms by type
    const roomTypeCounts = {
      'Room': 0,
      'Suite Room': 0,
      'Dormitory': 0,
      'Barrack': 0
    };

    rooms.forEach(room => {
      const bedCount = room.bedCount || 0;
      const allocatedBeds = room.allocatedBeds || 0;
      const roomType = room.roomType || 'Room';

      // Count by room type
      if (roomTypeCounts.hasOwnProperty(roomType)) {
        roomTypeCounts[roomType]++;
      } else {
        // If room type is not in the enum, count it as 'Room'
        roomTypeCounts['Room']++;
      }

      // Count occupancy status
      if (allocatedBeds === 0) {
        unoccupied++;
      } else if (allocatedBeds === bedCount) {
        occupied++;
      } else {
        partiallyOccupied++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalBlocks,
        totalRooms,
        occupied,
        unoccupied,
        partiallyOccupied,
        roomTypeCounts: {
          room: roomTypeCounts['Room'],
          suiteRoom: roomTypeCounts['Suite Room'],
          dormitory: roomTypeCounts['Dormitory'],
          barrack: roomTypeCounts['Barrack']
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: error.message
    });
  }
});

module.exports = router;
