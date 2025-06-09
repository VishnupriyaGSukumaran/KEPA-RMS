const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  blockName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  blockTypes: {
    type: [String],
    enum: ['Suit Room', 'Room', 'Dormitory', 'Barrack'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Block', blockSchema);

