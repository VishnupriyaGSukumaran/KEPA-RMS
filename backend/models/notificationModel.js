const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },       // Short message
  type: { type: String, required: true },           // e.g., 'blockhead', 'courseOrder'
  data: {
    title: String,                                  // Course Title
    description: String,                            // Course Description
    fileName: String,                               // PDF file name
    filePath: String                                // File path for download
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
