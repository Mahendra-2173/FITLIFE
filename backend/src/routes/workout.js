const express = require('express');
const router = express.Router();
const { generateWorkoutPlan, refineExercise } = require('../services/groqService');
const { validateWorkoutPlan } = require('../validators/schemas');

// In-memory store
let workoutPlanStore = null;
const sessionHistory = [];

// POST /api/workout/generate
router.post('/generate', async (req, res) => {
  try {
    const { profile, customPrompt } = req.body;
    const userProfile = profile || req.body;
    if (!userProfile || !userProfile.goal) {
      return res.status(400).json({ success: false, error: 'User profile with goal is required' });
    }

    console.log('[workout/generate] Generating plan with custom prompt:', customPrompt || 'None');
    const validatedPlan = await generateWorkoutPlan(userProfile, customPrompt);

    // Final safety check with Zod
    const validation = validateWorkoutPlan(validatedPlan);
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        error: 'AI generated an invalid workout plan structure',
        details: validation.error.issues.map(i => i.message),
      });
    }

    workoutPlanStore = validation.data;
    return res.json({ success: true, data: workoutPlanStore });

  } catch (err) {
    console.error('[workout/generate]', err);
    return res.status(500).json({ success: false, error: 'Failed to generate workout plan. Please try again.' });
  }
});

// GET /api/workout/plan
router.get('/plan', (req, res) => {
  if (!workoutPlanStore) {
    return res.status(404).json({ success: false, error: 'No workout plan generated yet' });
  }
  res.json({ success: true, data: workoutPlanStore });
});

// POST /api/workout/refine
router.post('/refine', async (req, res) => {
  try {
    const { exercise, reason, profile } = req.body;
    if (!exercise || !profile) {
      return res.status(400).json({ success: false, error: 'Exercise and profile are required' });
    }

    const result = await refineExercise(exercise, reason || 'User requested alternative', profile);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('[workout/refine]', err);
    res.status(500).json({ success: false, error: 'Failed to generate alternatives. Please try again.' });
  }
});

// POST /api/workout/session
router.post('/session', (req, res) => {
  try {
    const session = {
      ...req.body,
      completedAt: new Date().toISOString(),
      id: Date.now().toString(),
    };
    sessionHistory.push(session);
    res.json({ success: true, data: session, message: 'Session saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save session' });
  }
});

// GET /api/workout/history
router.get('/history', (req, res) => {
  res.json({ success: true, data: sessionHistory });
});

module.exports = router;
