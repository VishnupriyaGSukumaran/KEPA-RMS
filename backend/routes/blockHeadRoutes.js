const express = require('express');
const router = express.Router();
const BlockHead = require('../models/blockHeadModel');
const Notification = require('../models/notificationModel');

// GET: All block heads
router.get('/', async (req, res) => {
  try {
    const blockHeads = await BlockHead.find();
    res.json(blockHeads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Add a new block head and send notification to Superadmin
router.post('/', async (req, res) => {
  const { name, penNumber, designation, contact, email, block } = req.body;

  try {
    // Check if PEN already exists
    const existing = await BlockHead.findOne({ penNumber });
    //if (existing) {
 //     return res.status(400).json({ message: 'Block head with this PEN number already exists' });
  //  }

    // Save Block Head
    const newBlockHead = new BlockHead({
      name,
      penNumber,
      designation,
      contact,
      email,
      block,
    });
    const savedBlockHead = await newBlockHead.save();

    // ✅ Save a notification to Superadmin
    const newNotification = new Notification({
      type: 'BlockHeadAssignment',
      message: `New Block Head assigned: ${name} to ${block}`,
      data: savedBlockHead, // send all data
    });
    await newNotification.save();

    res.status(201).json(savedBlockHead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Update an existing block head by ID
router.put('/:id', async (req, res) => {
  const { name, penNumber, designation, contact, email, block } = req.body;

  try {
    const updated = await BlockHead.findByIdAndUpdate(
      req.params.id,
      { name, penNumber, designation, contact, email, block },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Block head not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating block head:", err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Remove a block head by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await BlockHead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Block head not found' });
    }
    res.json({ message: 'Block head deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
