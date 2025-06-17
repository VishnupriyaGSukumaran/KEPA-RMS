const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  officerName: String,
  penNumber: String,
  designation: String,
  contact: String,
  block: String,
  roomPreference: String,
  dateRange: String,
});

module.exports = mongoose.model('Allocation', allocationSchema);
