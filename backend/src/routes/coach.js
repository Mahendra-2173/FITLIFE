const express = require('express');
const router = express.Router();
const { askCoach } = require('../services/groqService');
const { validateCoachResponse } = require('../validators/schemas');

// POST /api/coach
router.post('/', async (req, res) => {
  try {
    const { question, profile, currentPlan } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }
    if (question.length > 1000) {
      return res.status(400).json({ success: false, error: 'Question is too long (max 1000 characters)' });
    }

    console.log('[coach] Question:', question.substring(0, 50));
    const result = await askCoach(question.trim(), profile, currentPlan);
    
    const validation = validateCoachResponse(result);
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: 'AI coach response did not meet schema requirements',
        details: validation.error.issues.map(i => i.message),
      });
    }

    return res.json({ success: true, data: validation.data });

  } catch (err) {
    console.error('[coach]', err);
    return res.status(500).json({ success: false, error: 'AI coach is temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
