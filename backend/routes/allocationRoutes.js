const express = require('express');
const multer = require('multer');
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Import your model (optional)
const Allocation = require('../models/allocationModel'); // create this if not yet

// POST route to handle allocations
router.post('/', upload.single('officerFile'), async (req, res) => {
  try {
    const {
      purpose,
      officerCount,
      requestedBlock,
      fromDate,
      toDate,
      notes,
    } = req.body;

    const filePath = req.file ? req.file.path : null;

    // Save to DB logic (mock for now)
    res.status(201).json({
      message: 'Allocation received successfully',
      data: {
        purpose,
        officerCount,
        requestedBlock,
        fromDate,
        toDate,
        notes,
        file: filePath,
      },
    });
  } catch (error) {
    console.error('Error in /api/allocations:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
