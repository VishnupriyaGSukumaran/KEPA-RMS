const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  purpose: {
    type: String,
    required: true
  },
  officerCount: {
    type: Number,
    required: true,
    min: 1
  },
  requestedBlock: {
    type: String,
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  officerFile: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true  // This adds createdAt and updatedAt automatically
});

// Index for faster queries
allocationSchema.index({ requestedBlock: 1, createdAt: -1 });
allocationSchema.index({ status: 1, isRead: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);