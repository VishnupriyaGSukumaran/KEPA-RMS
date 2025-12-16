const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Debug middleware - logs all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// ✅ Import all routes
const notificationRoutes = require('./routes/notificationRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const authRoutes = require('./routes/auth');
const createUserRoutes = require('./routes/createauth');
const blockHeadRoutes = require('./routes/blockHeadRoutes');
const blockRoutes = require('./routes/block');
const courseRoutes = require('./routes/courseRoutes');
const roomRoutes = require('./routes/room');
const courseOrderRoutes = require('./routes/courseOrderRoutes');
const roomAllocationRoutes = require('./routes/roomAllocationRoutes');
const reportRoutes = require('./routes/report');
const dashboardRoutes = require('./routes/dashboardRoutes');
const vacatingRoutes = require('./routes/vacatingRoutes'); // ✅ IMPORT

// ✅✅✅ REGISTER ALL ROUTES (BEFORE 404 HANDLER)
app.use('/api/createauth', createUserRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blockheads', blockHeadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/block', blockRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/course-orders', courseOrderRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/roomallocations', roomAllocationRoutes);
app.use('/api/vacating', vacatingRoutes); // ✅✅✅ REGISTER VACATING ROUTES
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    routes: {
      auth: [
        'POST /api/auth/login',
        'POST /api/createauth/register'
      ],
      allocations: [
        'POST /api/roomallocations',
        'POST /api/roomallocations/fetch-person',
        'DELETE /api/roomallocations/:id'
      ],
      vacating: [
        'GET /api/vacating/test',
        'POST /api/vacating',
        'GET /api/vacating',
        'GET /api/vacating/block/:blockName',
        'GET /api/vacating/date-range',
        'POST /api/vacating/search',
        'PATCH /api/vacating/:id/payment'
      ],
      reports: [
        'GET /api/reports/test',
        'POST /api/reports/course',
        'POST /api/reports/allocation',
        'POST /api/reports/vacancy',
        'POST /api/reports/block',
        'POST /api/reports/admin',
        'POST /api/reports/system'
      ],
      blocks: [
        'GET /api/block',
        'POST /api/block',
        'GET /api/block/:blockName'
      ],
      rooms: [
        'GET /api/room',
        'POST /api/room',
        'GET /api/room/block/:blockName'
      ]
    }
  });
});

// ✅✅✅ 404 HANDLER - MUST BE LAST
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    hint: 'Check /api/test for available routes'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Test server: http://localhost:${PORT}/api/test`);
  console.log(`✅ Test vacating: http://localhost:${PORT}/api/vacating/test`);
  console.log(`✅ Test reports: http://localhost:${PORT}/api/reports/test`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});