// routes/report.js - COMPLETE FIXED VERSION
const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const RoomAllocation = require("../models/RoomAllocation");
const Room = require("../models/Room");
const Block = require("../models/Block");
const Course = require("../models/Course");
const Account = require("../models/Account");

console.log('🟢 Report routes module loaded');

// Utility functions
const getMonthName = (m) =>
  [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ][m - 1];

const getDateRangeDescription = (month, year, years, startDate, endDate) => {
  if (month && year) return `${getMonthName(month)} ${year}`;
  if (year && !month) return `Year ${year}`;
  if (years?.length) return `Years: ${years.join(", ")}`;
  if (startDate && endDate)
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  return "All Time";
};

// ✅ TEST ROUTE
router.get("/test", (req, res) => {
  console.log("✅ TEST ROUTE HIT!");
  res.json({ 
    success: true,
    message: "Report routes are working!",
    timestamp: new Date().toISOString()
  });
});

// ✅ COURSE REPORT
router.post("/course", async (req, res) => {
  try {
    console.log('🟢 COURSE REPORT ROUTE HIT');
    console.log('Request body:', req.body);
    
    const { startDate, endDate, month, year, years, generatedBy } = req.body;
    
    let query = {};
    
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.startdate = { 
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      };
    } else if (year && !month) {
      query.startdate = {
        $gte: `${year}-01-01`,
        $lte: `${year}-12-31`
      };
    } else if (startDate && endDate) {
      query.startdate = {
        $gte: new Date(startDate).toISOString().split('T')[0],
        $lte: new Date(endDate).toISOString().split('T')[0]
      };
    }

    console.log('Query:', query);

    const courses = await Course.find(query).lean();
    console.log(`Found ${courses.length} courses`);
    
    const summary = {
      totalCourses: courses.length,
      dateRange: getDateRangeDescription(month, year, years, startDate, endDate),
      generatedBy: generatedBy || 'System',
      generatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      report: { 
        summary, 
        reportTitle: "Course Report" 
      },
      data: courses,
    });
  } catch (error) {
    console.error("❌ Course report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate course report: " + error.message 
    });
  }
});

// ✅ ALLOCATION REPORT
router.post("/allocation", async (req, res) => {
  try {
    console.log('🟢 ALLOCATION REPORT ROUTE HIT');
    const { startDate, endDate, month, year, blockName, purpose, generatedBy } = req.body;

    const query = {};
    if (blockName) query.block = blockName;
    if (purpose) query.purpose = purpose;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.allocationDate = { $gte: start, $lte: end };
    } else if (year && !month) {
      query.allocationDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      };
    } else if (startDate && endDate) {
      query.allocationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const allocations = await RoomAllocation.find(query).lean();
    console.log(`Found ${allocations.length} allocations`);

    const summary = {
      totalRecords: allocations.length,
      filteredByBlock: blockName || "All Blocks",
      filteredByPurpose: purpose || "All",
      dateRange: getDateRangeDescription(month, year, null, startDate, endDate),
    };

    res.status(200).json({
      success: true,
      report: {
        summary,
        reportTitle: "Room Allocation Report",
      },
      data: allocations,
    });
  } catch (error) {
    console.error("❌ Allocation report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate allocation report" 
    });
  }
});

// ✅ VACANCY REPORT
router.post("/vacancy", async (req, res) => {
  try {
    console.log('🟢 VACANCY REPORT ROUTE HIT');
    const { blockName, month, year } = req.body;
    const query = {};
    if (blockName) query.blockName = blockName;

    const rooms = await Room.find(query).lean();

    const data = rooms.map((room) => ({
      blockName: room.blockName,
      roomName: room.roomName,
      roomType: room.roomType || 'Standard',
      totalBeds: room.bedCount || 0,
      allocatedBeds: room.allocatedBeds || 0,
      currentVacantBeds: (room.bedCount || 0) - (room.allocatedBeds || 0),
      historicalAllocations: 0,
      lastAllocation: null,
      status:
        room.allocatedBeds === 0
          ? "Vacant"
          : room.allocatedBeds === room.bedCount
          ? "Full"
          : "Partial",
    }));

    const summary = {
      totalRooms: data.length,
      totalBeds: data.reduce((a, b) => a + b.totalBeds, 0),
      allocatedBeds: data.reduce((a, b) => a + b.allocatedBeds, 0),
      vacantBeds: data.reduce((a, b) => a + b.currentVacantBeds, 0),
      dateRange: getDateRangeDescription(month, year),
    };

    res.status(200).json({
      success: true,
      report: { summary, reportTitle: "Vacancy Report" },
      data,
    });
  } catch (error) {
    console.error("❌ Vacancy report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate vacancy report" 
    });
  }
});

// ✅ BLOCK REPORT
// ✅ BLOCK REPORT
router.post("/block", async (req, res) => {
  try {
    console.log('🟢 BLOCK REPORT ROUTE HIT');
    console.log('Request body:', req.body);

    const { blockName } = req.body;
    const blockQuery = blockName ? { blockName } : {};

    const blocks = await Block.find(blockQuery).lean();
    console.log(`Found ${blocks.length} blocks`);

    const detailedData = await Promise.all(blocks.map(async (block) => {
      const rooms = await Room.find({ blockName: block.blockName }).lean();

      const totalRooms = rooms.length;
      const totalBeds = rooms.reduce((sum, room) => sum + (room.bedCount || 0), 0);
      const allocatedBeds = rooms.reduce((sum, room) => sum + (room.allocatedBeds || 0), 0);
      const vacantBeds = totalBeds - allocatedBeds;
      const occupancyRate = totalBeds > 0 ? `${((allocatedBeds / totalBeds) * 100).toFixed(1)}%` : '0%';

      return {
        blockName: block.blockName,
        totalRooms,
        totalBeds,
        allocatedBeds,
        vacantBeds,
        occupancyRate,
        status: allocatedBeds === 0 ? 'Empty' : allocatedBeds === totalBeds ? 'Full' : 'Partial'
      };
    }));

    const summary = {
      totalBlocks: blocks.length,
      filteredBy: blockName || 'All Blocks',
      totalRooms: detailedData.reduce((sum, b) => sum + b.totalRooms, 0),
      totalBeds: detailedData.reduce((sum, b) => sum + b.totalBeds, 0),
      totalAllocated: detailedData.reduce((sum, b) => sum + b.allocatedBeds, 0),
      totalVacant: detailedData.reduce((sum, b) => sum + b.vacantBeds, 0)
    };

    res.status(200).json({
      success: true,
      report: { summary, reportTitle: "Block Report" },
      data: detailedData,
    });
  } catch (error) {
    console.error("❌ Block report error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate block report: " + error.message
    });
  }
});


// ✅ ADMIN REPORT
router.post("/admin", async (req, res) => {
  try {
    console.log('🟢 ADMIN REPORT ROUTE HIT');
    const admins = await Account.find({ role: { $in: ["Admin", "SuperAdmin"] } }).lean();
    res.status(200).json({
      success: true,
      report: {
        summary: { totalUsers: admins.length },
        reportTitle: "Admin Report",
      },
      data: admins,
    });
  } catch (error) {
    console.error("❌ Admin report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate admin report" 
    });
  }
});

// ✅ BLOCKHEAD REPORT
// ✅ BLOCKHEAD REPORT - FIXED VERSION
router.post("/blockhead", async (req, res) => {
  try {
    console.log('🟢 BLOCKHEAD REPORT ROUTE HIT');
    console.log('Request body:', req.body);
    
    const { blockName } = req.body;
    
    // Build base query for blockheads - check multiple possible field values
    let query = { 
      $or: [
        { role: "BlockHead" },
        { role: "blockhead" },
        { userType: "blockhead" }
      ]
    };
    
    // If specific block is selected, add to query
    if (blockName && blockName !== '' && blockName !== 'All Blocks') {
      // Add block filter to each OR condition
      query = {
        $and: [
          { $or: [
            { role: "BlockHead" },
            { role: "blockhead" },
            { userType: "blockhead" }
          ]},
          { assignedBlock: blockName }
        ]
      };
    }
    
    console.log('Mongoose Query:', JSON.stringify(query, null, 2));
    
    const blockheads = await Account.find(query).lean();
    console.log(`Found ${blockheads.length} block heads`);
    
    if (blockheads.length > 0) {
      console.log('Sample data:', blockheads[0]);
    } else {
      console.log('No blockheads found. Checking all users with role/userType fields...');
      const allUsers = await Account.find({}).select('role userType assignedBlock pen firstName lastName').limit(5).lean();
      console.log('Sample users in database:', allUsers);
    }
    
    const summary = {
      totalBlockHeads: blockheads.length,
      filteredBy: blockName || 'All Blocks',
      generatedAt: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      report: {
        summary,
        reportTitle: blockName && blockName !== 'All Blocks'
          ? `Block Head Report - ${blockName}` 
          : "Block Head Report - All Blocks",
      },
      data: blockheads,
    });
  } catch (error) {
    console.error("❌ Blockhead report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate blockhead report: " + error.message 
    });
  }
});

// ✅ SYSTEM REPORT
router.post("/system", async (req, res) => {
  try {
    console.log('🟢 SYSTEM REPORT ROUTE HIT');
    const totalRooms = await Room.countDocuments();
    const totalBlocks = await Block.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalAccounts = await Account.countDocuments();

    res.status(200).json({
      success: true,
      report: {
        summary: { 
          totalRooms, 
          totalBlocks, 
          totalCourses, 
          totalAccounts 
        },
        reportTitle: "System Overview Report",
      },
      data: []
    });
  } catch (error) {
    console.error("❌ System report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate system report" 
    });
  }
});

console.log('🟢 All report routes registered successfully');

module.exports = router;