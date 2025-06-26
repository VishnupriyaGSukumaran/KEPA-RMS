const mongoose = require('mongoose');

const roomAllocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  pen: {
    type: String
  },
  recruitmentNumber: {
    type: String
  },
  trainingCompany: {
    type: String
  },
  mobileNumber: {
    type: String,
    required: true
  },
  emergencyContact: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  unit: {
    type: String
  },
  district: {
    type: String
  },
  courseDetails: {
    type: String
  },
  remark: {
    type: String
  },
  roomNumber: {
    type: String,
    required: true
  },
  allocationDate: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  subPurpose: {
    type: String // 'Course' or 'Others' if applicable
  },
  block: {
    type: String,
    required: true
  },
  allocatedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RoomAllocation', roomAllocationSchema);
