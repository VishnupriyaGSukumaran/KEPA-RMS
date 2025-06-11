const express = require('express');
const router = express.Router(); // <-- this line is missing
const SystemAdmin = require('../models/SystemAdmin');
const Account = require('../models/Account');
const bcrypt = require('bcryptjs');
router.post('/login', async (req, res) => {
  const { pen, password } = req.body;

  try {
    // Try SystemAdmin collection first
    let user = await SystemAdmin.findOne({ pen });
    let role = 'superadmin';
    let assignedBlock = null;

    if (!user) {
      // Then try Account collection
      user = await Account.findOne({ pen });
      if (!user) {
        return res.status(401).json({ msg: 'Invalid pen or user not found' });
      }
      role = user.userType;
      assignedBlock = user.assignedBlock; // <-- get the block
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid password' });
    }

    return res.json({
      msg: 'Login successful',
      pen: user.pen,
      role: role,
      assignedBlock: assignedBlock || null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});



module.exports = router;
