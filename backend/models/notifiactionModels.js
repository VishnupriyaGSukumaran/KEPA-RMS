const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['courseOrder', 'general', 'alert', 'reminder'],
    default: 'courseOrder'
  },
  data: {
    title: String,
    description: String,
    fileName: String,
    filePath: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ acknowledged: 1 });

module.exports = mongoose.model('Notification', notificationSchema);