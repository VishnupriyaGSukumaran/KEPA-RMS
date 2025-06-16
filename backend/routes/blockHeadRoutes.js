const express = require('express');
const router = express.Router();
const BlockHead = require('../models/blockHeadModel');
const Notification = require('../models/notificationModel');

// CREATE Block Head
router.post('/', async (req, res) => {
  try {
    const { name, penNumber, designation, contact, email, block } = req.body;

    if (!name || !penNumber || !designation || !contact || !email || !block) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await BlockHead.findOne({ penNumber });
    if (existing) {
      return res.status(400).json({ message: 'Block head with this PEN already exists' });
    }

    const newHead = new BlockHead({ name, penNumber, designation, contact, email, block });
    await newHead.save();

    // ✅ Create a notification for Superadmin
    const message = `New Block Head assigned: ${name} (${designation}) for block ${block}`;
    const notification = new Notification({ message });
    await notification.save();

    // ✅ Respond once
    res.status(201).json({ message: 'Block head added and notification sent', data: newHead });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET All Block Heads
router.get('/', async (req, res) => {
  try {
    const blockHeads = await BlockHead.find();
    res.status(200).json(blockHeads);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// UPDATE Block Head
router.put('/:id', async (req, res) => {
  const { name, penNumber, designation, contact, email, block } = req.body;

  try {
    const existing = await BlockHead.findOne({ penNumber });
    if (existing && existing._id.toString() !== req.params.id) {
      return res.status(400).json({ message: "Block head with this PEN already exists" });
    }

    const updated = await BlockHead.findByIdAndUpdate(
      req.params.id,
      { name, penNumber, designation, contact, email, block },
      { new: true }
    );

    // ✅ Send notification to Superadmin
    const message = `Block Head Updated: ${name} (${designation}) for block ${block}`;
    const notification = new Notification({ message });
    await notification.save();

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// DELETE Block Head
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await BlockHead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Block Head not found' });
    }

    // ✅ Send notification to Superadmin
    const message = `Block Head Deleted: ${deleted.name} (${deleted.designation}) from block ${deleted.block}`;
    const notification = new Notification({ message });
    await notification.save();

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
});


module.exports = router;
