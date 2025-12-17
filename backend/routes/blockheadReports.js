// routes/blockheadReports.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const VacatingRecord = require('../models/VacatingRecord');
const Room = require('../models/Room');
const Block = require('../models/Block');

// ===== GET Allocated Persons Report for Specific Block =====
router.get('/allocated/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    const { filterType, date, month, year, startDate, endDate } = req.query;
    
    console.log(`📊 Fetching allocated persons report for block: ${blockName}`);
    console.log(`📅 Filter params:`, { filterType, date, month, year, startDate, endDate });

    // Build query
    let query = {
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    };

    // Apply date filters
    if (filterType && filterType !== 'all') {
      switch (filterType) {
        case 'date':
          if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.allocationDate = { $gte: startOfDay, $lte: endOfDay };
          }
          break;
        
        case 'month':
          if (month && year) {
            const monthNum = parseInt(month) - 1; // JS months are 0-indexed
            const startOfMonth = new Date(year, monthNum, 1);
            const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);
            query.allocationDate = { $gte: startOfMonth, $lte: endOfMonth };
          }
          break;
        
        case 'year':
          if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            query.allocationDate = { $gte: startOfYear, $lte: endOfYear };
          }
          break;
        
        case 'monthYear':
          if (month && year) {
            const monthNum = parseInt(month) - 1;
            const startOfMonth = new Date(year, monthNum, 1);
            const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);
            query.allocationDate = { $gte: startOfMonth, $lte: endOfMonth };
          }
          break;
        
        case 'dateRange':
          if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.allocationDate = { $gte: start, $lte: end };
          }
          break;
      }
    }

    console.log(`🔍 Query:`, JSON.stringify(query, null, 2));

    // Fetch allocations with filters
    const allocations = await RoomAllocation.find(query)
      .sort({ allocationDate: -1 })
      .lean();

    console.log(`✅ Found ${allocations.length} allocations for ${blockName}`);

    // Format the data
    const report = allocations.map(allocation => ({
      name: allocation.name,
      pen: allocation.pen || '-',
      recruitmentNumber: allocation.recruitmentNumber || '-',
      designation: allocation.designation || '-',
      unit: allocation.unit || '-',
      district: allocation.district || '-',
      roomNumber: allocation.roomNumber,
      bedIndex: allocation.bedIndex + 1,
      allocationDate: new Date(allocation.allocationDate).toLocaleDateString(),
      purpose: allocation.purpose,
      courseDetails: allocation.courseDetails || '-',
      mobileNumber: allocation.mobileNumber,
      emergencyContact: allocation.emergencyContact,
      address: allocation.address,
      trainingCompany: allocation.trainingCompany || '-',
      remark: allocation.remark || '-'
    }));

    res.status(200).json({
      success: true,
      blockName,
      totalAllocated: report.length,
      filterApplied: filterType || 'all',
      data: report
    });
  } catch (error) {
    console.error('❌ Error fetching allocated persons report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allocated persons report'
    });
  }
});

// ===== GET Vacated Persons Report for Specific Block =====
router.get('/vacated/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    const { filterType, date, month, year, startDate, endDate } = req.query;
    
    console.log(`📊 Fetching vacated persons report for block: ${blockName}`);
    console.log(`📅 Filter params:`, { filterType, date, month, year, startDate, endDate });

    // Build query
    let query = {
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    };

    // Apply date filters
    if (filterType && filterType !== 'all') {
      switch (filterType) {
        case 'date':
          if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.vacatingDate = { $gte: startOfDay, $lte: endOfDay };
          }
          break;
        
        case 'month':
          if (month && year) {
            const monthNum = parseInt(month) - 1;
            const startOfMonth = new Date(year, monthNum, 1);
            const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);
            query.vacatingDate = { $gte: startOfMonth, $lte: endOfMonth };
          }
          break;
        
        case 'year':
          if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            query.vacatingDate = { $gte: startOfYear, $lte: endOfYear };
          }
          break;
        
        case 'monthYear':
          if (month && year) {
            const monthNum = parseInt(month) - 1;
            const startOfMonth = new Date(year, monthNum, 1);
            const endOfMonth = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);
            query.vacatingDate = { $gte: startOfMonth, $lte: endOfMonth };
          }
          break;
        
        case 'dateRange':
          if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.vacatingDate = { $gte: start, $lte: end };
          }
          break;
      }
    }

    console.log(`🔍 Query:`, JSON.stringify(query, null, 2));

    // Fetch vacating records with filters
    const vacatedRecords = await VacatingRecord.find(query)
      .sort({ vacatingDate: -1 })
      .lean();

    console.log(`✅ Found ${vacatedRecords.length} vacated records for ${blockName}`);

    // Format the data
    const report = vacatedRecords.map(record => ({
      name: record.name,
      pen: record.pen || '-',
      recruitmentNumber: record.recruitmentNumber || '-',
      designation: record.designation || '-',
      unit: record.unit || '-',
      district: record.district || '-',
      roomNumber: record.roomNumber,
      bedIndex: record.bedIndex + 1,
      allocationDate: new Date(record.allocationDate).toLocaleDateString(),
      vacatingDate: new Date(record.vacatingDate).toLocaleDateString(),
      daysStayed: Math.ceil((new Date(record.vacatingDate) - new Date(record.allocationDate)) / (1000 * 60 * 60 * 24)),
      purpose: record.purpose,
      courseDetails: record.courseDetails || '-',
      paid: record.paid,
      paymentAmount: record.paymentAmount || '-',
      paymentMethod: record.paymentMethod || '-',
      vacatedBy: record.vacatedBy,
      mobileNumber: record.mobileNumber,
      trainingCompany: record.trainingCompany || '-',
      remark: record.remark || '-'
    }));

    res.status(200).json({
      success: true,
      blockName,
      totalVacated: report.length,
      filterApplied: filterType || 'all',
      data: report
    });
  } catch (error) {
    console.error('❌ Error fetching vacated persons report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vacated persons report'
    });
  }
});

// ===== GET Bed Availability Report for Specific Block =====
router.get('/bed-availability/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    console.log(`📊 Fetching bed availability report for block: ${blockName}`);

    // Fetch block data
    const block = await Block.findOne({
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Block not found'
      });
    }

    // Fetch all rooms for this block
    const rooms = await Room.find({
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    }).lean();

    console.log(`✅ Found ${rooms.length} rooms in ${blockName}`);

    // Calculate statistics by room type
    const roomTypeStats = {};
    let totalBeds = 0;
    let totalAllocated = 0;
    let totalVacant = 0;

    rooms.forEach(room => {
      const roomType = room.roomType || 'Unknown';
      const bedCount = room.beds?.length || room.bedCount || 0;
      const allocatedBeds = room.allocatedBeds || 0;
      const vacantBeds = bedCount - allocatedBeds;

      if (!roomTypeStats[roomType]) {
        roomTypeStats[roomType] = {
          roomType,
          totalRooms: 0,
          totalBeds: 0,
          allocatedBeds: 0,
          vacantBeds: 0,
          fullyOccupied: 0,
          partiallyOccupied: 0,
          vacant: 0,
          rooms: []
        };
      }

      roomTypeStats[roomType].totalRooms++;
      roomTypeStats[roomType].totalBeds += bedCount;
      roomTypeStats[roomType].allocatedBeds += allocatedBeds;
      roomTypeStats[roomType].vacantBeds += vacantBeds;

      if (allocatedBeds === 0) {
        roomTypeStats[roomType].vacant++;
      } else if (allocatedBeds === bedCount) {
        roomTypeStats[roomType].fullyOccupied++;
      } else {
        roomTypeStats[roomType].partiallyOccupied++;
      }

      roomTypeStats[roomType].rooms.push({
        roomName: room.roomName,
        floorNumber: room.floorNumber,
        totalBeds: bedCount,
        allocatedBeds,
        vacantBeds,
        status: allocatedBeds === 0 ? 'Vacant' : allocatedBeds === bedCount ? 'Fully Occupied' : 'Partially Occupied',
        isAC: room.isAC,
        attachedBathroom: room.attachedBathroom
      });

      totalBeds += bedCount;
      totalAllocated += allocatedBeds;
      totalVacant += vacantBeds;
    });

    res.status(200).json({
      success: true,
      blockName,
      summary: {
        totalRooms: rooms.length,
        totalBeds,
        totalAllocated,
        totalVacant,
        occupancyRate: totalBeds > 0 ? ((totalAllocated / totalBeds) * 100).toFixed(2) + '%' : '0%'
      },
      roomTypeBreakdown: Object.values(roomTypeStats)
    });
  } catch (error) {
    console.error('❌ Error fetching bed availability report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bed availability report'
    });
  }
});

// ===== GET Combined Summary Report =====
router.get('/summary/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    console.log(`📊 Fetching summary report for block: ${blockName}`);

    // Get all data in parallel
    const [allocations, vacatedRecords, rooms, block] = await Promise.all([
      RoomAllocation.find({ blockName: { $regex: `^${blockName}$`, $options: 'i' } }).lean(),
      VacatingRecord.find({ blockName: { $regex: `^${blockName}$`, $options: 'i' } }).lean(),
      Room.find({ blockName: { $regex: `^${blockName}$`, $options: 'i' } }).lean(),
      Block.findOne({ blockName: { $regex: `^${blockName}$`, $options: 'i' } })
    ]);

    if (!block) {
      return res.status(404).json({ success: false, error: 'Block not found' });
    }

    // Calculate totals
    const totalBeds = rooms.reduce((sum, room) => sum + (room.beds?.length || room.bedCount || 0), 0);
    const totalAllocated = rooms.reduce((sum, room) => sum + (room.allocatedBeds || 0), 0);
    const totalVacant = totalBeds - totalAllocated;

    res.status(200).json({
      success: true,
      blockName,
      summary: {
        totalRooms: rooms.length,
        totalBeds,
        currentlyAllocated: allocations.length,
        totalVacated: vacatedRecords.length,
        bedsAllocated: totalAllocated,
        bedsVacant: totalVacant,
        occupancyRate: totalBeds > 0 ? ((totalAllocated / totalBeds) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching summary report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary report'
    });
  }
});

module.exports = router;