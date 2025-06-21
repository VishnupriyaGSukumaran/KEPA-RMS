const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userType: { type: String,
              enum: ['admin', 'blockhead', 'superadmin'],
              required: true,
            },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  pen: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
assignedBlock: {
  type: String,
  required: function () {
    return this.userType === 'blockhead';
  },
  default: null
  // remove unique for now
}


}, { timestamps: true });


module.exports = mongoose.model('Account', userSchema);
