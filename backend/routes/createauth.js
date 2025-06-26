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
  confirmPassword, // ✅ add this
  assignedBlock    // ✅ optional for blockhead
} = req.body;



    // Basic validation
    if (!userType || !pen || !password || !confirmPassword || !email || !username) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if PEN or username already exists
    // Check if PEN or email or username already exists
// Check if PEN or email or username already exists
const existingUser = await User.findOne({
  $or: [{ pen }, { email }, { username }]
});

if (existingUser) {
  return res.status(400).json({
    message: 'User with this PEN, email, or username already exists'
  });
}

// ✅ Check if assignedBlock is already taken by another blockhead
if (userType === 'blockhead') {
  const existingBlockhead = await User.findOne({ assignedBlock });
  if (existingBlockhead) {
    return res.status(400).json({ message: 'This block is already assigned to another Block Head' });
  }
}

// Now hash the password and save the new user
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);




const newUser = new User({
  userType: userType.toLowerCase(),
  firstName,
  lastName,
  pen,
  phoneNumber,
  email,
  username,
  password: hashedPassword,
  assignedBlock: userType === 'blockhead' ? assignedBlock : undefined,
});

await newUser.save();
res.status(201).json({ message: 'User created successfully' });


    // Return success
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
