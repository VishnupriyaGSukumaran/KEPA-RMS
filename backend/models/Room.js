const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  blockName: { type: String, required: true },
  roomType: { type: String, required: true },
  roomName: { type: String, required: true },
  isAC: { type: Boolean, default: false },
  attachedBathroom: { type: Boolean, default: false },
  floorNumber: { type: Number },
  bedCount: { type: Number },
  additionalFacilities: Object
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
