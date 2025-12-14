const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');

// ✅ GET all notifications (sorted by newest first)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// ✅ GET single notification by ID
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ message: 'Failed to fetch notification' });
  }
});

// ✅ Mark all notifications as read (NOT DELETE)
router.put('/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// ✅ Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// ✅ Acknowledge notification (for processing)
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          read: true,
          readAt: new Date(),
          acknowledged: true,
          acknowledgedAt: new Date()
        } 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ 
      message: 'Notification acknowledged successfully',
      notification 
    });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({ message: 'Failed to acknowledge notification' });
  }
});

// ✅ DELETE single notification (only for individual delete button)
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// ✅ CHANGED: Mark all as acknowledged (instead of delete all)
// Only delete acknowledged notifications older than 30 days
router.delete('/clear-all', async (req, res) => {
  try {
    // Mark all as acknowledged instead of deleting
    const result = await Notification.updateMany(
      {},
      { 
        $set: { 
          read: true,
          readAt: new Date(),
          acknowledged: true,
          acknowledgedAt: new Date()
        } 
      }
    );
    
    res.json({ 
      message: 'All notifications marked as acknowledged',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

// ✅ NEW: Delete old acknowledged notifications (for admin cleanup)
router.delete('/cleanup/old', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      acknowledged: true,
      acknowledgedAt: { $lt: thirtyDaysAgo }
    });
    
    res.json({ 
      message: 'Old acknowledged notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    res.status(500).json({ message: 'Failed to cleanup old notifications' });
  }
});

// ✅ GET unread count
router.get('/stats/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// ✅ GET statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ read: false });
    const acknowledged = await Notification.countDocuments({ acknowledged: true });
    const pending = await Notification.countDocuments({ acknowledged: false });
    
    res.json({ 
      total,
      unread,
      read: total - unread,
      acknowledged,
      pending
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ message: 'Failed to get notification statistics' });
  }
});

module.exports = router;