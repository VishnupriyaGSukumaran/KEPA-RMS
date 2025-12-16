// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET all notifications (sorted by newest first)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all notifications...');
    const notifications = await Notification.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${notifications.length} notifications`);
    
    // Log unread and unacknowledged counts
    const unreadCount = notifications.filter(n => !n.read).length;
    const unacknowledgedCount = notifications.filter(n => !n.acknowledged).length;
    console.log(`   - Unread: ${unreadCount}`);
    console.log(`   - Unacknowledged: ${unacknowledgedCount}`);
    
    res.json(notifications);
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// GET unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    console.error('❌ Error counting unread notifications:', err);
    res.status(500).json({ message: 'Error counting notifications' });
  }
});

// GET single notification by ID
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Mark as read if not already
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }
    
    res.json(notification);
  } catch (err) {
    console.error('❌ Error fetching notification:', err);
    res.status(500).json({ message: 'Error fetching notification' });
  }
});

// POST: Create a new notification (for course orders with file upload)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Creating new notification...');
    console.log('   Body:', req.body);
    console.log('   File:', req.file);

    const { message, type, title, description } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const notificationData = {
      message,
      type: type || 'general',
      read: false,
      acknowledged: false
    };

    // Add file data if uploaded
    if (req.file) {
      notificationData.data = {
        title: title || 'Course Order',
        description: description || '',
        fileName: req.file.originalname,
        filePath: req.file.filename
      };
    } else if (title || description) {
      notificationData.data = {
        title: title || '',
        description: description || ''
      };
    }

    const notification = new Notification(notificationData);
    await notification.save();

    console.log('✅ Notification created:', notification._id);
    res.status(201).json({ 
      message: 'Notification created successfully',
      notification 
    });

  } catch (err) {
    console.error('❌ Error creating notification:', err);
    res.status(500).json({ 
      message: 'Error creating notification',
      error: err.message 
    });
  }
});

// PUT: Mark a single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
      console.log('✅ Notification marked as read:', req.params.id);
    }

    res.json({ 
      message: 'Notification marked as read',
      notification 
    });

  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// PUT: Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    console.log('📖 Marking all notifications as read...');
    const result = await Notification.updateMany(
      { read: false }, 
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    res.json({ 
      message: 'All notifications marked as read',
      count: result.modifiedCount 
    });

  } catch (err) {
    console.error('❌ Error marking all as read:', err);
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

// PUT: Acknowledge a notification
router.put('/:id/acknowledge', async (req, res) => {
  try {
    console.log('✅ Acknowledging notification:', req.params.id);
    
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as acknowledged and read
    notification.acknowledged = true;
    notification.acknowledgedAt = new Date();
    
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
    }
    
    await notification.save();

    console.log('✅ Notification acknowledged:', notification._id);
    res.json({ 
      message: 'Notification acknowledged successfully',
      notification 
    });

  } catch (err) {
    console.error('❌ Error acknowledging notification:', err);
    res.status(500).json({ message: 'Error acknowledging notification' });
  }
});

// PUT: Mark all as acknowledged (not delete - just acknowledge)
router.put('/acknowledge-all', async (req, res) => {
  try {
    console.log('✅ Acknowledging all notifications...');
    
    const result = await Notification.updateMany(
      { acknowledged: false },
      { 
        $set: { 
          acknowledged: true,
          acknowledgedAt: new Date(),
          read: true,
          readAt: new Date()
        } 
      }
    );

    console.log(`✅ Acknowledged ${result.modifiedCount} notifications`);
    res.json({ 
      message: 'All notifications acknowledged',
      count: result.modifiedCount 
    });

  } catch (err) {
    console.error('❌ Error acknowledging all:', err);
    res.status(500).json({ message: 'Error acknowledging notifications' });
  }
});

// DELETE: Delete a single notification
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting notification:', req.params.id);
    
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('✅ Notification deleted:', notification._id);
    res.json({ 
      message: 'Notification deleted successfully',
      notification 
    });

  } catch (error) {
    console.error('❌ Failed to delete notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// DELETE: Clear all notifications (mark as acknowledged, not actually delete)
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('🧹 Clearing all notifications (marking as acknowledged)...');
    
    const result = await Notification.updateMany(
      {},
      { 
        $set: { 
          acknowledged: true,
          acknowledgedAt: new Date(),
          read: true,
          readAt: new Date()
        } 
      }
    );

    console.log(`✅ Cleared ${result.modifiedCount} notifications`);
    res.json({ 
      message: 'All notifications cleared (marked as acknowledged)',
      count: result.modifiedCount 
    });

  } catch (error) {
    console.error('❌ Failed to clear notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// DELETE: Permanently delete all notifications (use with caution)
router.delete('/delete-all/permanent', async (req, res) => {
  try {
    console.log('⚠️ PERMANENTLY deleting all notifications...');
    
    const result = await Notification.deleteMany({});
    
    console.log(`✅ Permanently deleted ${result.deletedCount} notifications`);
    res.json({ 
      message: 'All notifications permanently deleted',
      count: result.deletedCount 
    });

  } catch (error) {
    console.error('❌ Failed to delete notifications:', error);
    res.status(500).json({ message: 'Failed to delete notifications' });
  }
});

module.exports = router;