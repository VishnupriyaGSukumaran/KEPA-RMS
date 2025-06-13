// KEPA-RMS/backend/models/blockHeadModel.js

const mongoose = require('mongoose');

// Define schema for Block Head
const blockHeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  penNumber: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String,  // Optional
  },
  block: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Export model
module.exports = mongoose.model('BlockHead', blockHeadSchema);
