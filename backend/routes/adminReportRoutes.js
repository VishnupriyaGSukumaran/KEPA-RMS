// File: routes/adminReportRoutes.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const VacatingRecord = require('../models/VacatingRecord');
const Room = require('../models/Room');
const Block = require('../models/Block');
const BlockHead = require('../models/blockHeadModel');

// Helper function to build date filter
const buildDateFilter = (query) => {
  const { date, month, year, startDate, endDate } = query;
  const filter = {};

  if (date) {
    // Specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.$gte = startOfDay;
    filter.$lte = endOfDay;
  } else if (month && year) {
    // Specific month and year
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    filter.$gte = startOfMonth;
    filter.$lte = endOfMonth;
  } else if (month) {
    // Specific month (current year)
    const currentYear = new Date().getFullYear();
    const startOfMonth = new Date(currentYear, month - 1, 1);
    const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);
    filter.$gte = startOfMonth;
    filter.$lte = endOfMonth;
  } else if (year) {
    // Specific year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    filter.$gte = startOfYear;
    filter.$lte = endOfYear;
  } else if (startDate && endDate) {
    // Date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$gte = start;
    filter.$lte = end;
  }

  return Object.keys(filter).length > 0 ? filter : null;
};

// ===== 1. ALLOCATED PERSONS REPORT =====
router.get('/allocated', async (req, res) => {
  try {
    console.log('📊 Generating Allocated Persons Report');
    const { block } = req.query;
    
    let matchQuery = {};
    
    // Block filter
    if (block) {
      matchQuery.blockName = { $regex: new RegExp(`^${block}$`, 'i') };
    }
    
    // Date filter
    const dateFilter = buildDateFilter(req.query);
    if (dateFilter) {
      matchQuery.allocationDate = dateFilter;
    }

    const allocations = await RoomAllocation.find(matchQuery)
      .select('-__v -updatedAt')
      .sort({ allocationDate: -1 })
      .lean();

    const reportData = allocations.map(allocation => ({
      name: allocation.name,
      pen: allocation.pen || allocation.recruitmentNumber || '-',
      designation: allocation.designation || '-',
      unit: allocation.unit || '-',
      district: allocation.district || '-',
      mobile: allocation.mobileNumber || '-',
      emergency_contact: allocation.emergencyContact || '-',
      block: allocation.blockName || allocation.block,
      room: allocation.roomNumber,
      bed_number: allocation.bedIndex !== undefined ? allocation.bedIndex + 1 : '-',
      purpose: allocation.purpose || '-',
      course_details: allocation.courseDetails || '-',
      allocation_date: allocation.allocationDate ? 
        new Date(allocation.allocationDate).toLocaleDateString() : '-',
      allocated_by: allocation.allocatedBy || '-',
      remark: allocation.remark || '-'
    }));

    console.log(`✅ Found ${reportData.length} allocations`);

    res.status(200).json({
      success: true,
      message: 'Allocated persons report generated',
      count: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating allocated report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate allocated persons report',
      error: error.message
    });
  }
});

// ===== 2. VACATED PERSONS REPORT =====
router.get('/vacated', async (req, res) => {
  try {
    console.log('📊 Generating Vacated Persons Report');
    const { block } = req.query;
    
    let matchQuery = {};
    
    // Block filter
    if (block) {
      matchQuery.blockName = { $regex: new RegExp(`^${block}$`, 'i') };
    }
    
    // Date filter
    const dateFilter = buildDateFilter(req.query);
    if (dateFilter) {
      matchQuery.vacatingDate = dateFilter;
    }

    const vacatedRecords = await VacatingRecord.find(matchQuery)
      .select('-__v -updatedAt')
      .sort({ vacatingDate: -1 })
      .lean();

    const reportData = vacatedRecords.map(record => ({
      name: record.name,
      pen: record.pen || record.recruitmentNumber || '-',
      designation: record.designation || '-',
      unit: record.unit || '-',
      district: record.district || '-',
      mobile: record.mobileNumber || '-',
      emergency_contact: record.emergencyContact || '-',
      block: record.blockName || record.block,
      room: record.roomNumber,
      bed_number: record.bedIndex !== undefined ? record.bedIndex + 1 : '-',
      purpose: record.purpose || '-',
      allocation_date: record.allocationDate ? 
        new Date(record.allocationDate).toLocaleDateString() : '-',
      vacating_date: record.vacatingDate ? 
        new Date(record.vacatingDate).toLocaleDateString() : '-',
      payment_status: record.paid || '-',
      payment_amount: record.paymentAmount || '-',
      payment_method: record.paymentMethod || '-',
      vacated_by: record.vacatedBy || '-',
      remark: record.remark || '-'
    }));

    console.log(`✅ Found ${reportData.length} vacated records`);

    res.status(200).json({
      success: true,
      message: 'Vacated persons report generated',
      count: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating vacated report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate vacated persons report',
      error: error.message
    });
  }
});

// ===== 3. BED AVAILABILITY REPORT =====
router.get('/availability', async (req, res) => {
  try {
    console.log('📊 Generating Bed Availability Report');
    const { block } = req.query;
    
    let matchQuery = {};
    
    // Block filter
    if (block) {
      matchQuery.blockName = { $regex: new RegExp(`^${block}$`, 'i') };
    }

    const rooms = await Room.find(matchQuery)
      .select('blockName roomName roomType bedCount allocatedBeds beds floorNumber isAC attachedBathroom')
      .lean();

    const reportData = rooms.map(room => {
      const totalBeds = room.bedCount || room.beds?.length || 0;
      const allocatedBeds = room.allocatedBeds || 
        (room.beds?.filter(b => b.status === 'allocated').length) || 0;
      const vacantBeds = totalBeds - allocatedBeds;
      
      let status = 'Vacant';
      if (allocatedBeds === totalBeds && totalBeds > 0) {
        status = 'Fully Occupied';
      } else if (allocatedBeds > 0 && allocatedBeds < totalBeds) {
        status = 'Partially Occupied';
      }

      return {
        block: room.blockName,
        room_name: room.roomName,
        room_type: room.roomType,
        floor: room.floorNumber || '-',
        total_beds: totalBeds,
        allocated_beds: allocatedBeds,
        vacant_beds: vacantBeds,
        status: status,
        ac: room.isAC ? 'Yes' : 'No',
        attached_bathroom: room.attachedBathroom ? 'Yes' : 'No'
      };
    });

    // Calculate summary
    const summary = {
      total_rooms: reportData.length,
      total_beds: reportData.reduce((sum, r) => sum + r.total_beds, 0),
      total_allocated: reportData.reduce((sum, r) => sum + r.allocated_beds, 0),
      total_vacant: reportData.reduce((sum, r) => sum + r.vacant_beds, 0),
      fully_occupied: reportData.filter(r => r.status === 'Fully Occupied').length,
      partially_occupied: reportData.filter(r => r.status === 'Partially Occupied').length,
      vacant: reportData.filter(r => r.status === 'Vacant').length
    };

    console.log(`✅ Generated availability report for ${reportData.length} rooms`);

    res.status(200).json({
      success: true,
      message: 'Bed availability report generated',
      summary: summary,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating availability report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bed availability report',
      error: error.message
    });
  }
});

// ===== 4. BLOCK HEAD DETAILS REPORT =====
router.get('/blockhead-detail', async (req, res) => {
  try {
    console.log('📊 Generating Block Head Details Report');
    const { block } = req.query;
    
    let matchQuery = {};
    
    // Block filter
    if (block) {
      matchQuery.block = { $regex: new RegExp(`^${block}$`, 'i') };
    }

    const blockHeads = await BlockHead.find(matchQuery)
      .select('-__v -updatedAt')
      .sort({ block: 1 })
      .lean();

    const reportData = await Promise.all(blockHeads.map(async (bh) => {
      // Get block statistics
      const blockDoc = await Block.findOne({ 
        blockName: { $regex: new RegExp(`^${bh.block}$`, 'i') } 
      });
      
      const rooms = await Room.find({ 
        blockName: { $regex: new RegExp(`^${bh.block}$`, 'i') } 
      });

      const totalRooms = rooms.length;
      const totalBeds = rooms.reduce((sum, r) => sum + (r.bedCount || 0), 0);
      const allocatedBeds = rooms.reduce((sum, r) => sum + (r.allocatedBeds || 0), 0);
      const vacantBeds = totalBeds - allocatedBeds;

      const allocations = await RoomAllocation.find({ 
        blockName: { $regex: new RegExp(`^${bh.block}$`, 'i') } 
      });

      return {
        block_name: bh.block,
        blockhead_name: bh.name,
        pen_number: bh.penNumber,
        designation: bh.designation,
        contact: bh.contact,
        email: bh.email || '-',
        total_rooms: totalRooms,
        total_beds: totalBeds,
        allocated_beds: allocatedBeds,
        vacant_beds: vacantBeds,
        current_occupants: allocations.length,
        created_date: bh.createdAt ? 
          new Date(bh.createdAt).toLocaleDateString() : '-'
      };
    }));

    console.log(`✅ Generated block head report for ${reportData.length} block heads`);

    res.status(200).json({
      success: true,
      message: 'Block head details report generated',
      count: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating block head report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate block head details report',
      error: error.message
    });
  }
});

// ===== 5. BLOCK DETAILS REPORT =====
router.get('/block-detail', async (req, res) => {
  try {
    console.log('📊 Generating Block Details Report');
    const { block } = req.query;
    
    let matchQuery = {};
    
    // Block filter
    if (block) {
      matchQuery.blockName = { $regex: new RegExp(`^${block}$`, 'i') };
    }

    const blocks = await Block.find(matchQuery)
      .select('-__v -updatedAt')
      .sort({ blockName: 1 })
      .lean();

    const reportData = await Promise.all(blocks.map(async (blockDoc) => {
      // Get room statistics
      const rooms = await Room.find({ 
        blockName: { $regex: new RegExp(`^${blockDoc.blockName}$`, 'i') } 
      });

      const totalRooms = rooms.length;
      const totalBeds = rooms.reduce((sum, r) => sum + (r.bedCount || 0), 0);
      const allocatedBeds = rooms.reduce((sum, r) => sum + (r.allocatedBeds || 0), 0);
      const vacantBeds = totalBeds - allocatedBeds;

      // Room type breakdown
      const roomTypes = {};
      rooms.forEach(room => {
        const type = room.roomType || 'Unknown';
        if (!roomTypes[type]) {
          roomTypes[type] = 0;
        }
        roomTypes[type]++;
      });

      // Get current allocations
      const allocations = await RoomAllocation.find({ 
        blockName: { $regex: new RegExp(`^${blockDoc.blockName}$`, 'i') } 
      });

      // Get block head
      const blockHead = await BlockHead.findOne({ 
        block: { $regex: new RegExp(`^${blockDoc.blockName}$`, 'i') } 
      });

      return {
        block_name: blockDoc.blockName,
        block_head: blockHead ? blockHead.name : 'Not Assigned',
        total_rooms: totalRooms,
        room_types: Object.entries(roomTypes)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ') || '-',
        total_beds: totalBeds,
        allocated_beds: allocatedBeds,
        vacant_beds: vacantBeds,
        occupancy_rate: totalBeds > 0 ? 
          `${((allocatedBeds / totalBeds) * 100).toFixed(1)}%` : '0%',
        current_occupants: allocations.length,
        created_date: blockDoc.createdAt ? 
          new Date(blockDoc.createdAt).toLocaleDateString() : '-'
      };
    }));

    console.log(`✅ Generated block report for ${reportData.length} blocks`);

    res.status(200).json({
      success: true,
      message: 'Block details report generated',
      count: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating block report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate block details report',
      error: error.message
    });
  }
});

// ===== TEST ENDPOINT =====
router.get('/test', (req, res) => {
  console.log('✅ Admin Reports routes test endpoint hit');
  res.json({ 
    message: 'Admin Reports routes are working!',
    timestamp: new Date().toISOString(),
    availableReports: [
      'GET /allocated - Allocated persons report',
      'GET /vacated - Vacated persons report',
      'GET /availability - Bed availability report',
      'GET /blockhead-detail - Block head details report',
      'GET /block-detail - Block details report'
    ]
  });
});

module.exports = router;