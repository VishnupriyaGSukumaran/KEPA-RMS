const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const notificationRoutes = require('./routes/notificationRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const createUserRoutes = require('./routes/createauth');
const blockHeadRoutes = require('./routes/blockHeadRoutes');
const blockRoutes = require('./routes/block'); // ✅ this will now be correct
const courseRoutes = require('./routes/courseRoutes');
const roomRoutes = require('./routes/room');
const BlockHeadNewRoutes = require('./routes/BlockHeadNew');

const courseOrderRoutes = require('./routes/courseOrderRoutes');
const roomAllocationRoutes = require('./routes/roomAllocationRoutes');


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/createauth', createUserRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/blockheads', blockHeadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/block', blockRoutes); // ✅ only once
app.use('/api/allocations', allocationRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/blockheadnew', BlockHeadNewRoutes);

app.use('/api/course-orders', courseOrderRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/allocate', roomAllocationRoutes);
app.use('/api/roomallocations', roomAllocationRoutes); // ✅ Add this




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
