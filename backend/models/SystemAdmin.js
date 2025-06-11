const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const systemAdminSchema = new mongoose.Schema({
  pen: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'superadmin', required: true },
 
}, {
  collection: 'superadmin' // 
});

systemAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('SystemAdmin', systemAdminSchema);
