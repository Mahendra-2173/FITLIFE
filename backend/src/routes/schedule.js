const express = require('express');
const router = express.Router();
const { generateDailySchedule } = require('../services/groqService');
const { validateDailySchedule } = require('../validators/schemas');

let scheduleStore = null;

// POST /api/schedule/generate
router.post('/generate', async (req, res) => {
  try {
    const { profile, workoutDay, customRoutine } = req.body;
    const userProfile = profile || req.body;
    if (!userProfile) {
      return res.status(400).json({ success: false, error: 'User profile is required' });
    }

    const validatedSchedule = await generateDailySchedule(userProfile, workoutDay, customRoutine);
    const validation = validateDailySchedule(validatedSchedule);
    
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: 'Failed to generate a valid daily schedule format',
        details: validation.error.issues.map(i => i.message),
      });
    }

    scheduleStore = validation.data;
    return res.json({ success: true, data: scheduleStore });

  } catch (err) {
    console.error('[schedule/generate]', err);
    return res.status(500).json({ success: false, error: 'Failed to generate schedule. Please try again.' });
  }
});

// GET /api/schedule/today
router.get('/today', (req, res) => {
  if (!scheduleStore) {
    return res.status(404).json({ success: false, error: 'No schedule generated yet' });
  }
  res.json({ success: true, data: scheduleStore });
});

module.exports = router;
