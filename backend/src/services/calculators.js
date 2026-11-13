/**
 * Pure calculation functions for fitness metrics.
 * All formulas are scientifically established.
 */

/**
 * Calculate BMI
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number}
 */
function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Get BMI category and color
 * @param {number} bmi
 * @returns {{ category: string, color: string, description: string }}
 */
function getBMICategory(bmi) {
  if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6', description: 'Below healthy weight range' };
  if (bmi < 25) return { category: 'Normal weight', color: '#10b981', description: 'Healthy weight range' };
  if (bmi < 30) return { category: 'Overweight', color: '#f59e0b', description: 'Above healthy weight range' };
  return { category: 'Obese', color: '#ef4444', description: 'Significantly above healthy weight range' };
}

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender - 'male' | 'female' | 'other'
 * @returns {number} BMR in kcal/day
 */
function calculateBMR(weightKg, heightCm, age, gender) {
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === 'female') return Math.round(base - 161);
  return Math.round(base + 5); // male and other default to male formula
}

/**
 * Activity multipliers
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number}
 */
function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate calorie target based on fitness goal
 * @param {number} tdee
 * @param {string} goal
 * @returns {{ calories: number, adjustment: string }}
 */
function getCalorieTarget(tdee, goal) {
  const adjustments = {
    weight_loss: { delta: -500, label: '500 kcal deficit for gradual weight loss' },
    fat_loss: { delta: -300, label: '300 kcal deficit for fat loss while preserving muscle' },
    muscle_building: { delta: 300, label: '300 kcal surplus for lean muscle gain' },
    weight_gain: { delta: 500, label: '500 kcal surplus for weight gain' },
    weight_maintenance: { delta: 0, label: 'Maintenance calories' },
    general_fitness: { delta: 0, label: 'Maintenance calories for general fitness' },
  };
  const adj = adjustments[goal] || adjustments.general_fitness;
  return {
    calories: Math.max(1200, tdee + adj.delta),
    adjustment: adj.label,
  };
}

/**
 * Get macro targets in grams
 * @param {number} calories
 * @param {string} goal
 * @param {number} weightKg
 * @returns {{ protein: number, carbs: number, fat: number }}
 */
function getMacroTargets(calories, goal, weightKg) {
  let proteinPerKg = 1.6;
  if (goal === 'muscle_building') proteinPerKg = 2.0;
  if (goal === 'weight_loss' || goal === 'fat_loss') proteinPerKg = 1.8;

  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCals = protein * 4;
  const fatCals = calories * 0.25;
  const fat = Math.round(fatCals / 9);
  const carbCals = calories - proteinCals - fatCals;
  const carbs = Math.round(Math.max(0, carbCals) / 4);

  return { protein, carbs, fat };
}

/**
 * Calculate healthy weight range for a given height
 * @param {number} heightCm
 * @returns {{ min: number, max: number }}
 */
function getHealthyWeightRange(heightCm) {
  const heightM = heightCm / 100;
  return {
    min: parseFloat((18.5 * heightM * heightM).toFixed(1)),
    max: parseFloat((24.9 * heightM * heightM).toFixed(1)),
  };
}

/**
 * Calculate estimated water intake target
 * @param {number} weightKg
 * @param {string} activityLevel
 * @returns {number} litres per day
 */
function getWaterTarget(weightKg, activityLevel) {
  let base = weightKg * 0.033;
  if (activityLevel === 'very_active' || activityLevel === 'extremely_active') base += 0.5;
  return parseFloat(base.toFixed(1));
}

module.exports = {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  getCalorieTarget,
  getMacroTargets,
  getHealthyWeightRange,
  getWaterTarget,
  ACTIVITY_MULTIPLIERS,
};
