const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path if needed

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { pen, password } = req.body;

  try {
    const user = await User.findOne({ pen });

    if (!user) {
      return res.status(401).json({ msg: 'Invalid pen' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid password' });
    }

    // Success: send back user info (you can also send a JWT token here)
    return res.json({
      msg: 'Login successful',
      pen: user.pen,
      role: user.role,
      // token: '...optional if using JWT'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
