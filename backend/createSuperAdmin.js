const mongoose = require('mongoose');
const SystemAdmin = require('./models/SystemAdmin'); // your model already has pre-save hook

const MONGODB_URI = 'mongodb+srv://keparms:keparms@cluster0.mgnqtku.mongodb.net/kepa';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');

    const superadminData = {
      pen: 'KP0005',
      password: '808625',
      role: 'superadmin',
    };

    try {
      const existing = await SystemAdmin.findOne({ pen: superadminData.pen });
      if (existing) {
        console.log('Superadmin with this PEN already exists.');
      } else {
        const superadmin = new SystemAdmin(superadminData);
        await superadmin.save();
        console.log('Superadmin created successfully.');
      }
    } catch (error) {
      console.error('Error creating superadmin:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
