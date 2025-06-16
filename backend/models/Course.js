// backend/models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  coordinator: { type: String, required: true },
  subcoordinator: { type: String },
  startdate: { type: String }, // You can also use: Date
  enddate: { type: String },   // You can also use: Date
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
