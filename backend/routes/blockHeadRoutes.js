// backend/routes/blockHeadRoutes.js - UPDATED HELPER FUNCTION

const express = require('express');
const router = express.Router();
const BlockHead = require('../models/blockHeadModel');
const Notification = require('../models/notificationModel');

// ✅ FIXED: Helper function with proper type handling
const createNotification = async (message, notificationType = 'alert') => {
  try {
    // Validate type is one of the allowed enum values
    const validTypes = ['courseOrder', 'general', 'alert', 'reminder', 'info'];
    const type = validTypes.includes(notificationType) ? notificationType : 'alert';

    const notification = new Notification({
      message: message,
      type: type, // ✅ Always explicitly set
      read: false,
      acknowledged: false,
      createdAt: new Date()
    });

    const savedNotification = await notification.save();
    console.log('✅ Notification created successfully:', {
      id: savedNotification._id,
      type: savedNotification.type,
      message: savedNotification.message
    });
    return savedNotification;

  } catch (error) {
    console.error('❌ Failed to create notification:', {
      message: error.message,
      type: error.name,
      details: error.errors
    });
    // Don't throw - just log
    return null;
  }
};

// CREATE Block Head
router.post('/', async (req, res) => {
  try {
    const { name, penNumber, designation, contact, email, block } = req.body;

    console.log('📥 Received Block Head data:', req.body);

    // Validate required fields
    if (!name || !penNumber || !designation || !contact || !email || !block) {
      return res.status(400).json({ 
        message: 'All fields are required',
        missingFields: {
          name: !name,
          penNumber: !penNumber,
          designation: !designation,
          contact: !contact,
          email: !email,
          block: !block
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for duplicate PEN number
    const existingByPen = await BlockHead.findOne({ penNumber: penNumber.trim() });
    if (existingByPen) {
      return res.status(400).json({ 
        message: `Block head with PEN number "${penNumber}" already exists` 
      });
    }

    // Check for duplicate email
    const existingByEmail = await BlockHead.findOne({ email: email.toLowerCase().trim() });
    if (existingByEmail) {
      return res.status(400).json({ 
        message: `Block head with email "${email}" already exists` 
      });
    }

    // Create new Block Head
    const newHead = new BlockHead({ 
      name: name.trim(),
      penNumber: penNumber.trim(),
      designation: designation.trim(),
      contact: contact.trim(),
      email: email.toLowerCase().trim(),
      block: block.trim()
    });

    await newHead.save();
    console.log('✅ Block Head saved:', newHead);

    // Create notification for Superadmin - with proper error handling
    await createNotification(
      `New Block Head assigned: ${name} (${designation}) for ${block}`,
      'alert'
    );

    res.status(201).json({ 
      message: 'Block head added successfully',
      data: newHead 
    });

  } catch (error) {
    console.error('❌ Error creating Block Head:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `A block head with this ${field} already exists` 
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating block head',
      error: error.message 
    });
  }
});

// GET All Block Heads
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all Block Heads...');
    const blockHeads = await BlockHead.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${blockHeads.length} Block Heads`);
    res.status(200).json(blockHeads);
  } catch (error) {
    console.error('❌ Error fetching Block Heads:', error);
    res.status(500).json({ message: 'Server error while fetching block heads' });
  }
});

// GET Block Head by ID
router.get('/:id', async (req, res) => {
  try {
    const blockHead = await BlockHead.findById(req.params.id);
    
    if (!blockHead) {
      return res.status(404).json({ message: 'Block head not found' });
    }
    
    res.status(200).json(blockHead);
  } catch (error) {
    console.error('❌ Error fetching Block Head:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE Block Head
router.put('/:id', async (req, res) => {
  try {
    const { name, penNumber, designation, contact, email, block } = req.body;
    const blockHeadId = req.params.id;

    console.log('📝 Updating Block Head:', blockHeadId, req.body);

    // Validate required fields
    if (!name || !penNumber || !designation || !contact || !email || !block) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if block head exists
    const existingBlockHead = await BlockHead.findById(blockHeadId);
    if (!existingBlockHead) {
      return res.status(404).json({ message: 'Block head not found' });
    }

    // Check for duplicate PEN number (excluding current record)
    const duplicatePen = await BlockHead.findOne({ 
      penNumber: penNumber.trim(),
      _id: { $ne: blockHeadId }
    });
    
    if (duplicatePen) {
      return res.status(400).json({ 
        message: `Another block head with PEN number "${penNumber}" already exists` 
      });
    }

    // Check for duplicate email (excluding current record)
    const duplicateEmail = await BlockHead.findOne({ 
      email: email.toLowerCase().trim(),
      _id: { $ne: blockHeadId }
    });
    
    if (duplicateEmail) {
      return res.status(400).json({ 
        message: `Another block head with email "${email}" already exists` 
      });
    }

    // Update Block Head
    const updated = await BlockHead.findByIdAndUpdate(
      blockHeadId,
      { 
        name: name.trim(),
        penNumber: penNumber.trim(),
        designation: designation.trim(),
        contact: contact.trim(),
        email: email.toLowerCase().trim(),
        block: block.trim()
      },
      { new: true, runValidators: true }
    );

    console.log('✅ Block Head updated:', updated);

    // Create notification
    await createNotification(
      `Block Head updated: ${name} (${designation}) for ${block}`,
      'alert'
    );

    res.status(200).json({ 
      message: 'Block head updated successfully',
      data: updated 
    });

  } catch (error) {
    console.error('❌ Error updating Block Head:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    res.status(500).json({ 
      message: 'Server error while updating block head',
      error: error.message 
    });
  }
});

// DELETE Block Head
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting Block Head:', req.params.id);

    const deleted = await BlockHead.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Block head not found' });
    }

    console.log('✅ Block Head deleted:', deleted);

    // Create notification
    await createNotification(
      `Block Head removed: ${deleted.name} (${deleted.designation}) from ${deleted.block}`,
      'alert'
    );

    res.status(200).json({ 
      message: 'Block head deleted successfully',
      data: deleted 
    });

  } catch (error) {
    console.error('❌ Error deleting Block Head:', error);
    res.status(500).json({ 
      message: 'Server error while deleting block head',
      error: error.message 
    });
  }
});

// GET Block Heads by Block Name
router.get('/block/:blockName', async (req, res) => {
  try {
    const blockName = req.params.blockName;
    const blockHeads = await BlockHead.find({ 
      block: new RegExp(`^${blockName}$`, 'i') 
    });
    
    res.status(200).json(blockHeads);
  } catch (error) {
    console.error('❌ Error fetching Block Heads by block:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;