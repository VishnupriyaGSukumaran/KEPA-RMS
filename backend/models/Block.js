const mongoose = require('mongoose');

const roomDetailSchema = new mongoose.Schema({
  roomName: String,
  floorNumber: Number,
  bedCount: Number,
  isAC: Boolean,
  attachedBathroom: Boolean,
  additionalFacilities: Object
}, { _id: false });

const blockTypeDetailSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Room', 'Dormitory', 'Suite Room', 'Barrack']
  },
  count: Number,
  rooms: [roomDetailSchema]
}, { _id: false });



const blockSchema = new mongoose.Schema({
  blockName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  blockTypes: {
    type: [String],
    enum: ['Room', 'Dormitory', 'Suite Room', 'Barrack'],
    required: true
  },
  roomCounts: {
    type: Object,
    required: true
  },
  blockTypeDetails: [blockTypeDetailSchema], // Grouped by type
  createdRooms: {
    type: [roomDetailSchema], // ✅ Flat list of all rooms (optional but useful)
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Always store blockName in Title Case
blockSchema.pre('save', function (next) {
  this.blockName = this.blockName
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
  next();
});

module.exports = mongoose.model('Block', blockSchema);
