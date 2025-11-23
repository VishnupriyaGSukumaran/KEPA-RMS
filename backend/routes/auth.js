const express = require('express');
const router = express.Router();
const SystemAdmin = require('../models/SystemAdmin');
const Account = require('../models/Account');
const Block = require('../models/Block'); // <-- NEW
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
      assignedBlock = user.assignedBlock;

      // ✅ Check if Block still exists for BlockHead
      if (user.userType === 'blockhead') {
        const blockExists = await Block.findOne({
          blockName: { $regex: `^${user.assignedBlock}$`, $options: 'i' }
        });

        if (!blockExists) {
          return res.status(403).json({
            msg: `Your assigned block "${user.assignedBlock}" no longer exists. Please contact the administrator.`
          });
        }
      }
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

// GET blockhead by PEN (for dashboard)
router.get('/blockheadnew/:pen', async (req, res) => {
  try {
    const { pen } = req.params;
    const user = await Account.findOne({ pen });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching blockhead:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
