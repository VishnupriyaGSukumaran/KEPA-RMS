// File: models/VacatingRecord.js
const mongoose = require('mongoose');

const vacatingRecordSchema = new mongoose.Schema({
  // Person Details
  name: { type: String, required: true },
  pen: { type: String },
  recruitmentNumber: { type: String },
  mobileNumber: { type: String },
  emergencyContact: { type: String },
  designation: { type: String },
  unit: { type: String },
  district: { type: String },
  address: { type: String },
  
  // Room Details
  roomNumber: { type: String, required: true },
  block: { type: String, required: true },
  blockName: { type: String, required: true },
  bedIndex: { type: Number },
  trainingCompany: { type: String },
  
  // Allocation Details
  allocationDate: { type: Date },
  purpose: { type: String },
  courseDetails: { type: String },
  remark: { type: String },
  
  // Vacating Details
  vacatingDate: { type: Date, required: true },
  paid: { type: String, enum: ['Yes', 'No'], required: true },
  vacatedBy: { type: String, default: 'System' },
  vacatedAt: { type: Date, default: Date.now },
  
  // Payment Details (if paid)
  paymentAmount: { type: Number },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  paymentReference: { type: String },
  
  // Original allocation ID for reference
  originalAllocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAllocation' }
}, {
  timestamps: true
});

// Index for faster queries
vacatingRecordSchema.index({ pen: 1 });
vacatingRecordSchema.index({ recruitmentNumber: 1 });
vacatingRecordSchema.index({ block: 1 });
vacatingRecordSchema.index({ vacatingDate: 1 });

module.exports = mongoose.model('VacatingRecord', vacatingRecordSchema);