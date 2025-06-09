const express = require('express');
const router = express.Router();
const Block = require('../models/Block');

// POST /api/blocks - Create a new block
router.post('/', async (req, res) => {
  const { blockName, blockTypes } = req.body;

  if (!blockName || !blockTypes || blockTypes.length === 0) {
    return res.status(400).json({ message: 'Block name and at least one type are required.' });
  }

  try {
    // Check if the block name already exists
    const existingBlock = await Block.findOne({ blockName });
    if (existingBlock) {
      return res.status(409).json({ message: 'Block with this name already exists.' });
    }

    const newBlock = new Block({ blockName, blockTypes });
    await newBlock.save();

    res.status(201).json({ message: 'Block saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Could not save block.' });
  }
});


// GET /api/blocks - Retrieve all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await Block.find();
    res.status(200).json(blocks);
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ message: 'Server error. Could not retrieve blocks.' });
  }
});

// DELETE /api/block/:id - Delete a block by ID
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    res.json({ message: 'Block deleted successfully' });
  } catch (error) {
    console.error('Error deleting block:', error);
    res.status(500).json({ message: 'Failed to delete block' });
  }
});


module.exports = router;
