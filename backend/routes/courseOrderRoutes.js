const express = require('express');
const router = express.Router();
const multer = require('multer');
const Notification = require('../models/notificationModel');

// 1. Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 2. POST route to receive form data and send notification
router.post('/', upload.single('courseFile'), async (req, res) => {
  try {
    const { courseTitle, courseDesc } = req.body;
    const file = req.file;

    // 3. Create notification to SuperAdmin
    const newNotification = new Notification({
      message: `New course order: ${courseTitle}`,
      type: 'courseOrder',
      data: {
        title: courseTitle,
        description: courseDesc,
        fileName: file?.originalname || '',
        filePath: file?.path || '',
      },
    });

    await newNotification.save();

    res.status(201).json({ message: 'Course order forwarded to SuperAdmin' });
  } catch (error) {
    console.error('Error forwarding course order:', error);
    res.status(500).json({ message: 'Failed to forward course order' });
  }
});

module.exports = router;
