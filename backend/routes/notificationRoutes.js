const express = require('express');
const router = express.Router();

// Just a test route for now
router.get('/', (req, res) => {
  res.send('Notification route working');
});

module.exports = router;
