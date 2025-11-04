const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['allocation', 'vacancy', 'course', 'block', 'admin', 'blockhead', 'complete'],
    required: true
  },
  reportTitle: {
    type: String,
    required: true
  },
  generatedBy: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  filters: {
    blockName: String,
    purpose: String,
    courseTitle: String,
    status: String,
    userType: String
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  summary: {
    totalRecords: Number,
    totalBeds: Number,
    allocatedBeds: Number,
    vacantBeds: Number,
    totalRooms: Number,
    totalBlocks: Number,
    totalCourses: Number,
    totalUsers: Number,
    additionalStats: mongoose.Schema.Types.Mixed
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
reportSchema.virtual('formattedDate').get(function() {
  return this.generatedAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

module.exports = mongoose.model('Report', reportSchema);