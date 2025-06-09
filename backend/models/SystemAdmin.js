const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  pen: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, default:'superadmin', required: true }
});

module.exports = mongoose.model('superadmin', userSchema);
