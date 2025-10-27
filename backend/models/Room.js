// models/Room.js
const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: { type: Number, required: true },
  status: { type: String, enum: ['vacant', 'allocated'], default: 'vacant' },
  occupantName: { type: String, default: null },
});

const roomSchema = new mongoose.Schema({
  blockName: { type: String, required: true },
  roomType: { type: String, required: true },
  roomName: { type: String, required: true },
  isAC: { type: Boolean, default: false },
  attachedBathroom: { type: Boolean, default: false },
  floorNumber: { type: Number },
  bedCount: { type: Number },
  allocatedBeds: { type: Number, default: 0 },
  additionalFacilities: { type: Map, of: String },
  beds: [bedSchema], // For tracking each bed
}, { timestamps: true });

// Enforce unique roomName within the same block
roomSchema.index({ blockName: 1, roomName: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
