// backend/models/notificationModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  type: {
    type: String,
    enum: ['courseOrder', 'general', 'alert', 'reminder', 'info'],
    default: 'general', // ✅ CRITICAL: Provides default value
    required: false // ✅ Changed to false since we have a default
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
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
    type: Date,
    default: null
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update the updatedAt field
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ acknowledged: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);