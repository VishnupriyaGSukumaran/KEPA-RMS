const mongoose = require('mongoose');

const blockHeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  penNumber: { type: String, required: true, unique: true },
  designation: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  block: { type: String, required: true }
});

module.exports = mongoose.model('BlockHead', blockHeadSchema);
