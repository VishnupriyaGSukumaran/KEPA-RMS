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
router.post("/block", async (req, res) => {
  try {
    console.log('🟢 BLOCK REPORT ROUTE HIT');
    const blocks = await Block.find().lean();
    const summary = {
      totalBlocks: blocks.length,
    };

    res.status(200).json({
      success: true,
      report: { summary, reportTitle: "Block Report" },
      data: blocks,
    });
  } catch (error) {
    console.error("❌ Block report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate block report" 
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
router.post("/blockhead", async (req, res) => {
  try {
    console.log('🟢 BLOCKHEAD REPORT ROUTE HIT');
    const blockheads = await Account.find({ role: "BlockHead" }).lean();
    res.status(200).json({
      success: true,
      report: {
        summary: { totalBlockHeads: blockheads.length },
        reportTitle: "Block Head Report",
      },
      data: blockheads,
    });
  } catch (error) {
    console.error("❌ Blockhead report error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate blockhead report" 
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