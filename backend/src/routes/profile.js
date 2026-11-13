const express = require('express');
const router = express.Router();

// In-memory store (fallback when MongoDB not available)
let profileStore = null;

// GET /api/profile
router.get('/', (req, res) => {
  if (!profileStore) {
    return res.status(404).json({ success: false, error: 'No profile found' });
  }
  res.json({ success: true, data: profileStore });
});

// POST /api/profile
router.post('/', (req, res) => {
  try {
    const profile = req.body;
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid profile data' });
    }

    // Basic validation
    const required = ['age', 'weight', 'height', 'goal'];
    const missing = required.filter(f => !profile[f]);
    if (missing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    profileStore = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: profileStore, message: 'Profile saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save profile' });
  }
});

module.exports = router;
