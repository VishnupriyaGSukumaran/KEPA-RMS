const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  name: String,
  pen: String,
  recruitmentNumber: String,
  trainingCompany: String,
  mobileNumber: String,
  emergencyContact: String,
  address: String,
  designation: String,
  unit: String,
  district: String,
  courseDetails: String,
  remark: String,
  roomNumber: String,
  allocationDate: String,
  purpose: String
});

module.exports = mongoose.model('Allocation', AllocationSchema);
