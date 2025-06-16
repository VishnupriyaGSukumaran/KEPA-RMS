const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const createUserRoutes = require('./routes/createauth');
const blockRoutes = require('./routes/block'); // ✅ this will now be correct
const roomRoutes = require('./routes/room');




const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/createauth', createUserRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/block', blockRoutes); // ✅ Use consistent route path
app.use('/api/room', roomRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
