// File: routes/vacatingRoutes.js
const express = require('express');
const router = express.Router();
const VacatingRecord = require('../models/VacatingRecord');
const RoomAllocation = require('../models/RoomAllocation');

// ✅ Create vacating record
router.post('/', async (req, res) => {
  try {
    console.log('='.repeat(60));
    console.log('🔴 VACATING ROUTE HIT - POST /api/vacating');
    console.log('='.repeat(60));
    console.log('📥 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { allocationId, vacatingDate, paid, vacatedBy, paymentDetails } = req.body;

    // Validate required fields
    if (!allocationId) {
      console.log('❌ Missing allocationId');
      return res.status(400).json({ error: 'Allocation ID is required.' });
    }

    if (!vacatingDate) {
      console.log('❌ Missing vacatingDate');
      return res.status(400).json({ error: 'Vacating date is required.' });
    }

    if (!paid) {
      console.log('❌ Missing paid status');
      return res.status(400).json({ error: 'Paid status is required.' });
    }

    console.log('✅ All required fields present');
    console.log('🔍 Fetching allocation with ID:', allocationId);

    // Fetch the allocation to get all person details
    const allocation = await RoomAllocation.findById(allocationId);
    
    if (!allocation) {
      console.log('❌ Allocation not found for ID:', allocationId);
      return res.status(404).json({ error: 'Allocation not found.' });
    }

    console.log('✅ Allocation found:', {
      name: allocation.name,
      pen: allocation.pen,
      room: allocation.roomNumber,
      block: allocation.blockName || allocation.block
    });

    // Create vacating record with all details
    const vacatingData = {
      // Person Details
      name: allocation.name,
      pen: allocation.pen,
      recruitmentNumber: allocation.recruitmentNumber,
      mobileNumber: allocation.mobileNumber,
      emergencyContact: allocation.emergencyContact,
      designation: allocation.designation,
      unit: allocation.unit,
      district: allocation.district,
      address: allocation.address,
      
      // Room Details
      roomNumber: allocation.roomNumber,
      block: allocation.block || allocation.blockName,
      blockName: allocation.blockName || allocation.block,
      bedIndex: allocation.bedIndex,
      trainingCompany: allocation.trainingCompany,
      
      // Allocation Details
      allocationDate: allocation.allocationDate,
      purpose: allocation.purpose,
      courseDetails: allocation.courseDetails,
      remark: allocation.remark,
      
      // Vacating Details
      vacatingDate: new Date(vacatingDate),
      paid,
      vacatedBy: vacatedBy || 'System',
      originalAllocationId: allocation._id,
      
      // Payment Details (if provided)
      ...(paymentDetails && {
        paymentAmount: paymentDetails.amount,
        paymentMethod: paymentDetails.method,
        paymentDate: paymentDetails.date,
        paymentReference: paymentDetails.reference
      })
    };

    console.log('📝 Creating vacating record with data:', JSON.stringify(vacatingData, null, 2));

    const vacatingRecord = new VacatingRecord(vacatingData);
    
    console.log('💾 Attempting to save vacating record...');
    const savedRecord = await vacatingRecord.save();
    
    console.log('✅✅✅ VACATING RECORD SAVED SUCCESSFULLY');
    console.log('📄 Saved Record ID:', savedRecord._id);
    console.log('📄 Record Details:', {
      name: savedRecord.name,
      pen: savedRecord.pen,
      room: savedRecord.roomNumber,
      block: savedRecord.blockName,
      vacatingDate: savedRecord.vacatingDate
    });
    console.log('='.repeat(60));

    res.status(201).json({
      success: true,
      message: 'Vacating record created successfully.',
      vacatingRecord: savedRecord
    });

  } catch (err) {
    console.log('='.repeat(60));
    console.error('❌❌❌ ERROR IN VACATING ROUTE');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Full Error:', err);
    
    if (err.name === 'ValidationError') {
      console.error('Validation Errors:', err.errors);
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      console.error('Detailed Validation:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors 
      });
    }
    
    console.log('='.repeat(60));
    res.status(500).json({ 
      error: 'Failed to create vacating record.',
      message: err.message 
    });
  }
});

// ✅ Get all vacating records
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all vacating records...');
    const records = await VacatingRecord.find().sort({ vacatedAt: -1 });
    console.log(`✅ Found ${records.length} vacating records`);
    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching vacating records:', err);
    res.status(500).json({ error: 'Failed to fetch vacating records.' });
  }
});

// ✅ Get vacating records by block
router.get('/block/:blockName', async (req, res) => {
  try {
    const { blockName } = req.params;
    console.log('🔍 Fetching vacating records for block:', blockName);
    const records = await VacatingRecord.find({
      blockName: { $regex: `^${blockName}$`, $options: 'i' }
    }).sort({ vacatedAt: -1 });
    
    console.log(`✅ Found ${records.length} records for block ${blockName}`);
    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching block vacating records:', err);
    res.status(500).json({ error: 'Failed to fetch block vacating records.' });
  }
});

// ✅ Get vacating records by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('📅 Fetching records from', startDate, 'to', endDate);
    
    const query = {};
    if (startDate) query.vacatingDate = { $gte: new Date(startDate) };
    if (endDate) {
      query.vacatingDate = query.vacatingDate || {};
      query.vacatingDate.$lte = new Date(endDate);
    }
    
    const records = await VacatingRecord.find(query).sort({ vacatingDate: -1 });
    console.log(`✅ Found ${records.length} records in date range`);
    res.status(200).json(records);
  } catch (err) {
    console.error('Error fetching date range records:', err);
    res.status(500).json({ error: 'Failed to fetch records by date range.' });
  }
});

// ✅ Get vacating record by PEN or Recruitment Number
router.post('/search', async (req, res) => {
  try {
    const { pen, recruitmentNumber } = req.body;
    console.log('🔍 Searching for:', { pen, recruitmentNumber });
    
    let query = {};
    if (pen) query.pen = pen;
    if (recruitmentNumber) query.recruitmentNumber = recruitmentNumber;
    
    const records = await VacatingRecord.find(query).sort({ vacatedAt: -1 });
    
    if (records.length === 0) {
      console.log('❌ No records found');
      return res.status(404).json({ error: 'No vacating records found.' });
    }
    
    console.log(`✅ Found ${records.length} records`);
    res.status(200).json(records);
  } catch (err) {
    console.error('Error searching vacating records:', err);
    res.status(500).json({ error: 'Failed to search vacating records.' });
  }
});

// ✅ Update payment details for a vacating record
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, date, reference } = req.body;
    
    console.log('💳 Updating payment for record:', id);
    
    const record = await VacatingRecord.findByIdAndUpdate(
      id,
      {
        paid: 'Yes',
        paymentAmount: amount,
        paymentMethod: method,
        paymentDate: date,
        paymentReference: reference
      },
      { new: true }
    );
    
    if (!record) {
      console.log('❌ Record not found');
      return res.status(404).json({ error: 'Vacating record not found.' });
    }
    
    console.log('✅ Payment updated successfully');
    res.status(200).json({
      success: true,
      message: 'Payment details updated.',
      record
    });
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Failed to update payment details.' });
  }
});

// ✅ Test endpoint
router.get('/test', (req, res) => {
  console.log('✅ Vacating routes test endpoint hit');
  res.json({ 
    message: 'Vacating routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;