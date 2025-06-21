const express = require('express');
const router = express.Router();
const SystemAdmin = require('../models/SystemAdmin');
const Account = require('../models/Account');
const BlockHead = require('../models/blockHeadModel');

/**
 * GET /api/users/:pen
 * Finds user in SystemAdmin, Account, or BlockHead collections.
 */
router.get('/:pen', async (req, res) => {
  const { pen } = req.params;

  try {
    // Check SystemAdmin
    let user = await SystemAdmin.findOne({ pen });
    if (user) {
      return res.json({
        ...user._doc,
        userType: 'superadmin',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        assignedBlock: null
      });
    }

    // Check Account (e.g., Admin users)
    user = await Account.findOne({ pen });
    if (user) {
      return res.json({
        ...user._doc,
        userType: user.userType,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        assignedBlock: user.assignedBlock || null
      });
    }

    // Check BlockHead
    user = await BlockHead.findOne({ penNumber: pen });
    if (user) {
      const nameParts = user.name.split(' ');
      return res.json({
        ...user._doc,
        userType: 'blockhead',
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        assignedBlock: user.block
      });
    }

    return res.status(404).json({ message: 'User not found' });

  } catch (err) {
    console.error('Error in GET /api/users/:pen:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;