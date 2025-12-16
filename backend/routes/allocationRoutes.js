const express = require('express');
const router = express.Router();
const Allocation = require('../models/AllocationOrderModel'); // ✅ CORRECT IMPORT
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ CREATE NEW ALLOCATION ORDER
router.post('/', upload.single('officerFile'), async (req, res) => {
  try {
    console.log('📥 Received allocation request:', req.body);
    console.log('📎 File:', req.file);

    const {
      purpose,
      officerCount,
      requestedBlock,
      fromDate,
      toDate,
      notes
    } = req.body;

    // Validation
    if (!purpose || !officerCount || !requestedBlock || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const newAllocation = new Allocation({
      purpose,
      officerCount: parseInt(officerCount),
      requestedBlock: requestedBlock.trim(),
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      notes: notes || '',
      officerFile: req.file ? req.file.path : null,
      status: 'pending',
      isRead: false
    });

    const savedAllocation = await newAllocation.save();
    
    console.log('✅ Allocation saved successfully:', savedAllocation);

    res.status(201).json({
      success: true,
      message: 'Allocation order created successfully',
      allocation: savedAllocation
    });
  } catch (error) {
    console.error('❌ Error creating allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create allocation order',
      details: error.message
    });
  }
});

// ✅ GET ALL ALLOCATIONS FOR A SPECIFIC BLOCK
router.get('/block/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    console.log(`🔍 Fetching allocations for block: "${blockName}"`);
    
    const allocations = await Allocation.find({
      requestedBlock: { $regex: new RegExp(`^${blockName.trim()}$`, 'i') }
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${allocations.length} allocations for "${blockName}"`);
    
    res.status(200).json(allocations);
  } catch (error) {
    console.error('❌ Error fetching allocations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allocations',
      details: error.message
    });
  }
});

// ✅ MARK NOTIFICATION AS READ
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📖 Marking allocation ${id} as read`);
    
    const allocation = await Allocation.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: 'Allocation not found'
      });
    }

    console.log('✅ Marked as read:', allocation._id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      allocation
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      details: error.message
    });
  }
});

// ✅ GET ALL ALLOCATIONS (for admin)
router.get('/', async (req, res) => {
  try {
    const allocations = await Allocation.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${allocations.length} total allocations`);
    res.status(200).json(allocations);
  } catch (error) {
    console.error('❌ Error fetching all allocations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch allocations',
      details: error.message
    });
  }
});

// ✅ UPDATE ALLOCATION STATUS
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const allocation = await Allocation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: 'Allocation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Allocation status updated',
      allocation
    });
  } catch (error) {
    console.error('❌ Error updating allocation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update allocation status',
      details: error.message
    });
  }
});

// ✅ DELETE ALLOCATION
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const allocation = await Allocation.findByIdAndDelete(id);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: 'Allocation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Allocation deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete allocation',
      details: error.message
    });
  }
});

module.exports = router;