const express = require('express');
const router = express.Router();

// Simple test route without any validation or database
router.post('/test-simple', (req, res) => {
  console.log('Simple test route hit');
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Simple test works', body: req.body });
});

module.exports = router;
