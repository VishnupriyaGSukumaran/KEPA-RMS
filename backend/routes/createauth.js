const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/Account');

// POST /api/createauth/superadmin/create-user
router.post('/superadmin/create-user', async (req, res) => {
  try {
    const {
      userType,
      firstName,
      lastName,
      pen,
      phoneNumber,
      email,
      username,
      password,
      confirmPassword,
      assignedBlock
    } = req.body;

    // Basic validation
    if (!userType || !pen || !password || !confirmPassword || !email || !username) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if PEN, email, or username already exists
    const existingUser = await User.findOne({
      $or: [{ pen }, { email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this PEN, email, or username already exists'
      });
    }

    // Check if the block is already assigned to another Block Head
    if (userType.toLowerCase() === 'blockhead') {
      const existingBlockhead = await User.findOne({ assignedBlock });
      if (existingBlockhead) {
        return res.status(400).json({
          message: 'This block is already assigned to another Block Head'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the user
    const newUser = new User({
      userType: userType.toLowerCase(),
      firstName,
      lastName,
      pen,
      phoneNumber,
      email,
      username,
      password: hashedPassword,
      assignedBlock: userType.toLowerCase() === 'blockhead' ? assignedBlock : undefined
    });

    await newUser.save();
    return res.status(201).json({ message: 'User created successfully' });

  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
