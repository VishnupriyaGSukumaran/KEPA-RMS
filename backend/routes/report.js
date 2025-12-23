// File: routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const RoomAllocation = require('../models/RoomAllocation');
const VacatingRecord = require('../models/VacatingRecord');
const Room = require('../models/Room');
const Block = require('../models/Block');

// ==========================================
// 📊 ALLOCATION REPORT
// ==========================================
router.post('/allocation', async (req, res) => {
  try {
    console.log('📊 Allocation Report Request:', req.body);
    
    const { startDate, endDate, month, year, years, blockName, purpose } = req.body;
    
    let query = {};
    let dateFilter = {};

    // ✅ Date Filters
    if (startDate && !endDate) {
      // Date Only
      const date = new Date(startDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      dateFilter = {
        allocationDate: {
          $gte: date,
          $lt: nextDay
        }
      };
    } else if (startDate && endDate) {
      // Date Range
      dateFilter = {
        allocationDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (month && year) {
      // Month & Year
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        allocationDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else if (month && !year) {
      // Month Only (current year)
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59);
      dateFilter = {
        allocationDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else if (year && !month) {
      // Year Only
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        allocationDate: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    } else if (years && years.length > 0) {
      // Year Range (multiple years)
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const startOfRange = new Date(minYear, 0, 1);
      const endOfRange = new Date(maxYear, 11, 31, 23, 59, 59);
      dateFilter = {
        allocationDate: {
          $gte: startOfRange,
          $lte: endOfRange
        }
      };
    }

    // Apply date filter if exists
    if (Object.keys(dateFilter).length > 0) {
      query = { ...query, ...dateFilter };
    }

    // ✅ Block Filter
    if (blockName) {
      query.blockName = { $regex: `^${blockName}$`, $options: 'i' };
    }

    // ✅ Purpose Filter
    if (purpose) {
      query.purpose = purpose;
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // Fetch allocations
    const allocations = await RoomAllocation.find(query).sort({ allocationDate: -1 });

    console.log(`✅ Found ${allocations.length} allocations`);

    // Calculate summary
    const totalAllocations = allocations.length;
    const uniqueBlocks = [...new Set(allocations.map(a => a.blockName || a.block))];
    const uniqueRooms = [...new Set(allocations.map(a => a.roomNumber))];
    
    const purposeBreakdown = allocations.reduce((acc, curr) => {
      acc[curr.purpose] = (acc[curr.purpose] || 0) + 1;
      return acc;
    }, {});

    // Format date range for summary
    let dateRange = 'All Time';
    if (startDate && endDate) {
      dateRange = `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}`;
    } else if (startDate) {
      dateRange = new Date(startDate).toLocaleDateString('en-IN');
    } else if (month && year) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      dateRange = `${monthNames[month - 1]} ${year}`;
    } else if (year) {
      dateRange = `Year ${year}`;
    } else if (years && years.length > 0) {
      dateRange = `Years ${years.sort().join(', ')}`;
    }

    // Format data for response
    const formattedData = allocations.map(allocation => ({
      name: allocation.name,
      pen: allocation.pen,
      recruitmentNumber: allocation.recruitmentNumber,
      block: allocation.blockName || allocation.block,
      roomNumber: allocation.roomNumber,
      bedIndex: allocation.bedIndex,
      purpose: allocation.purpose,
      designation: allocation.designation,
      unit: allocation.unit,
      district: allocation.district,
      mobileNumber: allocation.mobileNumber,
      emergencyContact: allocation.emergencyContact,
      trainingCompany: allocation.trainingCompany,
      courseDetails: allocation.courseDetails,
      allocationDate: allocation.allocationDate,
      allocatedBy: allocation.allocatedBy,
      remark: allocation.remark
    }));

    res.status(200).json({
      success: true,
      report: {
        reportTitle: 'Room Allocation Report',
        generatedAt: new Date(),
        summary: {
          dateRange,
          totalAllocations,
          totalBlocks: uniqueBlocks.length,
          totalRooms: uniqueRooms.length,
          purposeBreakdown
        }
      },
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Error generating allocation report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate allocation report',
      message: error.message
    });
  }
});

// ==========================================
// 📊 VACANCY (VACATED) REPORT
// ==========================================
router.post('/vacancy', async (req, res) => {
  try {
    console.log('📊 Vacancy Report Request:', req.body);
    
    const { startDate, endDate, month, year, years, blockName } = req.body;
    
    let query = {};
    let dateFilter = {};

    // ✅ Date Filters
    if (startDate && !endDate) {
      // Date Only
      const date = new Date(startDate);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      dateFilter = {
        vacatingDate: {
          $gte: date,
          $lt: nextDay
        }
      };
    } else if (startDate && endDate) {
      // Date Range
      dateFilter = {
        vacatingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (month && year) {
      // Month & Year
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        vacatingDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else if (month && !year) {
      // Month Only (current year)
      const currentYear = new Date().getFullYear();
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59);
      dateFilter = {
        vacatingDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    } else if (year && !month) {
      // Year Only
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        vacatingDate: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
    } else if (years && years.length > 0) {
      // Year Range (multiple years)
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const startOfRange = new Date(minYear, 0, 1);
      const endOfRange = new Date(maxYear, 11, 31, 23, 59, 59);
      dateFilter = {
        vacatingDate: {
          $gte: startOfRange,
          $lte: endOfRange
        }
      };
    }

    // Apply date filter if exists
    if (Object.keys(dateFilter).length > 0) {
      query = { ...query, ...dateFilter };
    }

    // ✅ Block Filter
    if (blockName) {
      query.blockName = { $regex: `^${blockName}$`, $options: 'i' };
    }

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // Fetch vacating records
    const vacatedRecords = await VacatingRecord.find(query).sort({ vacatingDate: -1 });

    console.log(`✅ Found ${vacatedRecords.length} vacated records`);

    // Calculate summary
    const totalVacated = vacatedRecords.length;
    const paidCount = vacatedRecords.filter(r => r.paid === 'Yes').length;
    const unpaidCount = vacatedRecords.filter(r => r.paid === 'No').length;
    const uniqueBlocks = [...new Set(vacatedRecords.map(r => r.blockName || r.block))];
    
    const totalRevenue = vacatedRecords
      .filter(r => r.paid === 'Yes' && r.paymentAmount)
      .reduce((sum, r) => sum + (r.paymentAmount || 0), 0);

    const purposeBreakdown = vacatedRecords.reduce((acc, curr) => {
      acc[curr.purpose] = (acc[curr.purpose] || 0) + 1;
      return acc;
    }, {});

    // Format date range for summary
    let dateRange = 'All Time';
    if (startDate && endDate) {
      dateRange = `${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}`;
    } else if (startDate) {
      dateRange = new Date(startDate).toLocaleDateString('en-IN');
    } else if (month && year) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      dateRange = `${monthNames[month - 1]} ${year}`;
    } else if (year) {
      dateRange = `Year ${year}`;
    } else if (years && years.length > 0) {
      dateRange = `Years ${years.sort().join(', ')}`;
    }

    // Format data for response
    const formattedData = vacatedRecords.map(record => ({
      name: record.name,
      pen: record.pen,
      recruitmentNumber: record.recruitmentNumber,
      block: record.blockName || record.block,
      roomNumber: record.roomNumber,
      bedNumber: record.bedNumber,
      purpose: record.purpose,
      designation: record.designation,
      unit: record.unit,
      district: record.district,
      mobileNumber: record.mobileNumber,
      allocationDate: record.allocationDate,
      vacatingDate: record.vacatingDate,
      daysStayed: record.daysStayed,
      paid: record.paid,
      paymentAmount: record.paymentAmount,
      rate: record.rate,
      paymentMethod: record.paymentMethod,
      paymentDate: record.paymentDate,
      paymentReference: record.paymentReference,
      vacatedBy: record.vacatedBy,
      remark: record.remark
    }));

    res.status(200).json({
      success: true,
      report: {
        reportTitle: 'Room Vacancy (Vacated) Report',
        generatedAt: new Date(),
        summary: {
          dateRange,
          totalVacated,
          paidCount,
          unpaidCount,
          totalRevenue: `₹${totalRevenue.toFixed(2)}`,
          totalBlocks: uniqueBlocks.length,
          purposeBreakdown
        }
      },
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Error generating vacancy report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate vacancy report',
      message: error.message
    });
  }
});

// ==========================================
// 📊 BLOCK REPORT




// ==========================================
// 📊 BLOCK REPORT (COMPLETE FIX - Room Types & Block Heads)
// ==========================================
router.post('/block', async (req, res) => {
  try {
    console.log('📊 Block Report Request:', req.body);
    
    const { blockName } = req.body;
    const Account = require('../models/Account');
    
    let query = {};
    
    // ✅ Block Filter
    if (blockName) {
      query.blockName = { $regex: `^${blockName}$`, $options: 'i' };
    }

    // Fetch blocks
    const blocks = await Block.find(query).lean();
    console.log(`📦 Found ${blocks.length} blocks`);
    
    const blockData = await Promise.all(blocks.map(async (block) => {
      console.log(`\n🔍 Processing block: ${block.blockName}`);
      
      // ✅ Fetch ALL rooms for this block
      const rooms = await Room.find({
        blockName: { $regex: `^${block.blockName}$`, $options: 'i' }
      }).lean();

      console.log(`   📋 Found ${rooms.length} rooms in Room collection`);

      // ✅ Calculate overall stats
      const totalRooms = rooms.length;
      const totalBeds = rooms.reduce((sum, room) => sum + (room.bedCount || 0), 0);
      const allocatedBeds = rooms.reduce((sum, room) => sum + (room.allocatedBeds || 0), 0);
      const vacantBeds = totalBeds - allocatedBeds;
      const occupancyRate = totalBeds > 0 ? `${((allocatedBeds / totalBeds) * 100).toFixed(1)}%` : '0%';

      console.log(`   📊 Stats: ${totalRooms} rooms, ${totalBeds} beds, ${allocatedBeds} allocated`);

      // ✅ CRITICAL FIX: Get room type breakdown from ACTUAL rooms
      const roomTypeBreakdown = {};
      
      rooms.forEach(room => {
        const type = room.roomType || 'Unknown';
        
        if (!roomTypeBreakdown[type]) {
          roomTypeBreakdown[type] = {
            count: 0,
            totalBeds: 0,
            allocatedBeds: 0,
            vacantBeds: 0
          };
        }
        
        roomTypeBreakdown[type].count += 1;
        roomTypeBreakdown[type].totalBeds += room.bedCount || 0;
        roomTypeBreakdown[type].allocatedBeds += room.allocatedBeds || 0;
        roomTypeBreakdown[type].vacantBeds += (room.bedCount || 0) - (room.allocatedBeds || 0);
      });

      console.log(`   🏷️  Room Types:`, Object.keys(roomTypeBreakdown));
      Object.entries(roomTypeBreakdown).forEach(([type, data]) => {
        console.log(`      - ${type}: ${data.count} rooms, ${data.totalBeds} beds`);
      });

      // ✅ Find assigned block head from Account collection
      const assignedBlockHead = await Account.findOne({
        userType: 'blockhead',
        assignedBlock: { $regex: `^${block.blockName}$`, $options: 'i' }
      }).select('firstName lastName pen phoneNumber email').lean();

      if (assignedBlockHead) {
        console.log(`   👤 Block Head: ${assignedBlockHead.firstName} ${assignedBlockHead.lastName}`);
      } else {
        console.log(`   ⚠️  No Block Head assigned`);
      }

      return {
        blockName: block.blockName,
        totalRooms,
        totalBeds,
        allocatedBeds,
        vacantBeds,
        occupancyRate,
        status: block.status || 'Active',
        roomTypeBreakdown,  // ✅ This should now have data
        assignedBlockHead: assignedBlockHead ? {
          name: `${assignedBlockHead.firstName || ''} ${assignedBlockHead.lastName || ''}`.trim(),
          pen: assignedBlockHead.pen,
          phoneNumber: assignedBlockHead.phoneNumber,
          email: assignedBlockHead.email
        } : null
      };
    }));

    console.log(`\n✅ Block report generated successfully`);

    res.status(200).json({
      success: true,
      report: {
        reportTitle: 'Block Report',
        generatedAt: new Date(),
        summary: {
          totalBlocks: blockData.length,
          totalRooms: blockData.reduce((sum, b) => sum + b.totalRooms, 0),
          totalBeds: blockData.reduce((sum, b) => sum + b.totalBeds, 0),
          allocatedBeds: blockData.reduce((sum, b) => sum + b.allocatedBeds, 0),
          vacantBeds: blockData.reduce((sum, b) => sum + b.vacantBeds, 0)
        }
      },
      data: blockData
    });

  } catch (error) {
    console.error('❌ Error generating block report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate block report',
      message: error.message
    });
  }
});

module.exports = router;