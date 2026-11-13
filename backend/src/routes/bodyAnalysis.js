const express = require('express');
const router = express.Router();
const {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  getCalorieTarget,
  getMacroTargets,
  getHealthyWeightRange,
  getWaterTarget,
} = require('../services/calculators');

// POST /api/body-analysis
router.post('/', (req, res) => {
  try {
    const { age, gender, weight, height, targetWeight, goal, activityLevel } = req.body;

    if (!age || !weight || !height) {
      return res.status(400).json({ 
        success: false, 
        error: 'Age, weight, and height are required' 
      });
    }

    const bmi = calculateBMI(weight, height);
    const bmiInfo = getBMICategory(bmi);
    const bmr = calculateBMR(weight, height, age, gender || 'male');
    const tdee = calculateTDEE(bmr, activityLevel || 'moderately_active');
    const { calories, adjustment } = getCalorieTarget(tdee, goal || 'general_fitness');
    const macros = getMacroTargets(calories, goal || 'general_fitness', weight);
    const healthyRange = getHealthyWeightRange(height);
    const waterTarget = getWaterTarget(weight, activityLevel || 'moderately_active');
    const weightDiff = targetWeight ? parseFloat((targetWeight - weight).toFixed(1)) : null;

    res.json({
      success: true,
      data: {
        bmi,
        bmiCategory: bmiInfo.category,
        bmiColor: bmiInfo.color,
        bmiDescription: bmiInfo.description,
        bmr,
        tdee,
        calorieTarget: calories,
        calorieAdjustment: adjustment,
        macros,
        healthyWeightRange: healthyRange,
        waterTargetLitres: waterTarget,
        currentWeight: weight,
        targetWeight: targetWeight || null,
        weightDifference: weightDiff,
        disclaimer: 'BMI is a screening measure only and does not directly measure body fat or overall health. Consult a healthcare professional for personalized medical advice.',
      },
    });
  } catch (err) {
    console.error('[body-analysis]', err);
    res.status(500).json({ success: false, error: 'Failed to calculate body analysis' });
  }
});

module.exports = router;
