// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark all as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking as read' });
  }
});
// DELETE: Clear all notifications
router.delete('/clear-all', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});
// POST route to create a new notification
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const notification = new Notification({ message });

    await notification.save();
    res.status(201).json({ message: 'Notification saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
