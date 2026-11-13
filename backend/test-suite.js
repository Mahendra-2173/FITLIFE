/**
 * FITLIFE Automated Test Suite
 * Tests Recipe Generation, Structured Output Validation, Calculators, Error Handling, and Fallbacks
 */

const assert = require('assert');
const {
  validateRecipe,
  validateRecipeRequest,
  validateWorkoutPlan,
  validateDailySchedule,
  validateCoachResponse,
  RecipeSchema,
} = require('./src/validators/schemas');
const {
  generateRecipeFromIngredients,
  refineRecipeWithPrompt,
} = require('./src/services/groqService');
const {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  getCalorieTarget,
  getMacroTargets,
  getHealthyWeightRange,
  getWaterTarget,
} = require('./src/services/calculators');

async function runTestSuite() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧪 Running FITLIFE Comprehensive Test Suite                 ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // ─── 1. Request Validation Tests ──────────────────────────────────
  console.log('── 1. Recipe Request Validation Tests ──');

  test('Valid recipe request passes validation', () => {
    const validReq = {
      availableIngredients: ['Chicken breast', 'Spinach', 'Garlic'],
      dietaryPreference: 'high_protein',
      servings: 2,
      maxCookingTime: 30,
    };
    const res = validateRecipeRequest(validReq);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.servings, 2);
  });

  test('Rejects request with empty ingredients', () => {
    const invalidReq = {
      availableIngredients: '',
      servings: 2,
    };
    const res = validateRecipeRequest(invalidReq);
    assert.strictEqual(res.success, false);
  });

  // ─── 2. Zod Schema Integrity & Rejection Tests ───────────────────
  console.log('\n── 2. Structured AI Schema Validation Tests ──');

  test('Valid recipe structure passes schema validation', () => {
    const sampleRecipe = {
      id: 'rcp_test_1',
      name: 'Garlic Herb Chicken Skillet',
      description: 'A vibrant 20-minute skillet with lean protein and wilted greens.',
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      totalTimeMinutes: 25,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Mediterranean',
      dietaryCategory: 'High-Protein',
      ingredients: [
        { id: 'i1', name: 'Chicken Breast', quantity: 300, unit: 'grams', notes: '', isPantryStaple: false },
        { id: 'i2', name: 'Spinach', quantity: 150, unit: 'grams', notes: '', isPantryStaple: false }
      ],
      instructions: [
        { stepNumber: 1, instruction: 'Season chicken with sea salt and black pepper.', tip: 'Pat dry for sear.', timerMinutes: 0 },
        { stepNumber: 2, instruction: 'Sear in hot skillet for 5 minutes per side until golden.', tip: 'Do not disturb.', timerMinutes: 10 }
      ],
      substitutions: [
        { originalIngredient: 'Chicken', substituteIngredient: 'Firm Tofu', reasonOrRatio: '1:1 ratio' }
      ],
      estimatedNutrition: {
        caloriesPerServing: 350,
        proteinGrams: 42,
        carbsGrams: 5,
        fatGrams: 16,
        fiberGrams: 2,
        disclaimer: 'Estimated values calculated by AI nutrition engine; not for medical use.'
      },
      cookingTips: ['Rest meat 3 minutes before carving.'],
      tags: ['High-Protein', 'Low-Carb'],
      isAIGenerated: true,
      isFallback: false
    };

    const res = validateRecipe(sampleRecipe);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.name, 'Garlic Herb Chicken Skillet');
  });

  test('Rejects recipe with missing ingredients', () => {
    const invalidRecipe = {
      id: 'rcp_invalid_1',
      name: 'Empty Dish',
      description: 'Missing ingredients array.',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      totalTimeMinutes: 10,
      servings: 1,
      ingredients: [], // Violates min(1)
      instructions: [{ stepNumber: 1, instruction: 'Do something.' }],
      estimatedNutrition: { caloriesPerServing: 100, proteinGrams: 10, carbsGrams: 10, fatGrams: 2 }
    };

    const res = validateRecipe(invalidRecipe);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.issues.some(i => i.path.includes('ingredients')));
  });

  test('Rejects recipe with non-numeric ingredient quantity', () => {
    const invalidRecipe = {
      id: 'rcp_invalid_2',
      name: 'Bad Types',
      description: 'String in numeric quantity.',
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      totalTimeMinutes: 10,
      servings: 1,
      ingredients: [{ id: 'i1', name: 'Salt', quantity: 'a pinch', unit: 'pinch' }],
      instructions: [{ stepNumber: 1, instruction: 'Season well.' }],
      estimatedNutrition: { caloriesPerServing: 100, proteinGrams: 10, carbsGrams: 10, fatGrams: 2 }
    };

    const res = validateRecipe(invalidRecipe);
    assert.strictEqual(res.success, false);
  });

  test('Valid workout plan passes schema validation', () => {
    const sampleWorkout = {
      id: 'wp_test_1',
      programName: 'Upper / Lower Power Split',
      focus: 'Muscle Hypertrophy',
      weeklyPlan: [
        {
          day: 'Monday',
          focus: 'Upper Body Strength',
          durationMinutes: 45,
          isRestDay: false,
          exercises: [
            {
              id: 'e1',
              name: 'Barbell Bench Press',
              muscleGroup: 'Chest',
              category: 'Compound',
              sets: 4,
              reps: '8-10',
              restSeconds: 90,
              instructions: ['Lower bar to mid-chest', 'Press up explosively'],
              tips: 'Keep shoulder blades retracted'
            }
          ]
        },
        {
          day: 'Tuesday',
          focus: 'Active Rest & Recovery',
          durationMinutes: 20,
          isRestDay: true,
          exercises: []
        }
      ]
    };

    const res = validateWorkoutPlan(sampleWorkout);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.weeklyPlan.length, 2);
  });

  test('Valid coach protocol passes schema validation', () => {
    const sampleCoach = {
      question: 'How to recover faster?',
      summary: 'Focus on 8 hours of sleep and high hydration post-workout.',
      actionSteps: ['Drink 500ml water immediately', 'Perform 10 min light stretching'],
      nutritionTip: 'Consume 30g protein within 90 minutes of exercise.',
      workoutTip: 'Deload if resting heart rate remains elevated.',
      caution: 'Consult physician if joint pain persists.'
    };

    const res = validateCoachResponse(sampleCoach);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.actionSteps.length, 2);
  });

  // ─── 3. Fitness Calculator Tests ─────────────────────────────────
  console.log('\n── 3. Scientific Calculator Validation Tests ──');

  test('Calculates BMI and categories accurately', () => {
    // 70kg, 175cm -> 70 / (1.75^2) = 22.86 -> 22.9
    const bmi = calculateBMI(70, 175);
    assert.strictEqual(bmi, 22.9);
    const cat = getBMICategory(bmi);
    assert.strictEqual(cat.category, 'Normal weight');

    // 95kg, 175cm -> 95 / 3.0625 = 31.0
    const obeseBMI = calculateBMI(95, 175);
    assert.strictEqual(obeseBMI, 31.0);
    assert.strictEqual(getBMICategory(obeseBMI).category, 'Obese');
  });

  test('Calculates Mifflin-St Jeor BMR and TDEE correctly', () => {
    // Male: 10*75 + 6.25*180 - 5*25 + 5 = 750 + 1125 - 125 + 5 = 1755
    const bmrMale = calculateBMR(75, 180, 25, 'male');
    assert.strictEqual(bmrMale, 1755);

    // Female: base - 161
    const bmrFemale = calculateBMR(60, 165, 28, 'female');
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
    assert.strictEqual(bmrFemale, 1330);

    // TDEE with moderately active (1.55)
    const tdee = calculateTDEE(1755, 'moderately_active');
    assert.strictEqual(tdee, Math.round(1755 * 1.55));
  });

  test('Calculates Calorie Targets and Macro Distributions', () => {
    const tdee = 2500;
    const loss = getCalorieTarget(tdee, 'weight_loss');
    assert.strictEqual(loss.calories, 2000); // 500 deficit

    const macros = getMacroTargets(2000, 'weight_loss', 75);
    // 75kg * 1.8 = 135g protein
    assert.strictEqual(macros.protein, 135);
    assert.ok(macros.carbs > 0);
    assert.ok(macros.fat > 0);
  });

  test('Calculates Water Target accurately', () => {
    // 70kg * 0.033 = 2.31 -> 2.3
    const water = getWaterTarget(70, 'moderately_active');
    assert.strictEqual(water, 2.3);

    // Very active adds 0.5L
    const activeWater = getWaterTarget(70, 'very_active');
    assert.strictEqual(activeWater, 2.8);
  });

  // ─── 4. End-to-End Generation & Resilient Fallback Tests ──────────
  console.log('\n── 4. Recipe Generation & Fallback Tests ──');

  await asyncTest('generateRecipeFromIngredients returns validated recipe and marks fallback correctly', async () => {
    const result = await generateRecipeFromIngredients({
      availableIngredients: 'Chicken breast, baby spinach, garlic, olive oil',
      dietaryPreference: 'high_protein',
      servings: 2,
      maxCookingTime: 25
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.data.name.length > 0);
    assert.ok(result.data.ingredients.length >= 2);
    assert.ok(result.data.instructions.length >= 2);
    assert.strictEqual(typeof result.data.estimatedNutrition.caloriesPerServing, 'number');
    assert.strictEqual(typeof result.isFallback, 'boolean');
    assert.strictEqual(typeof result.isAIGenerated, 'boolean');
  });

  await asyncTest('generateRecipeFromIngredients handles vegetarian preference in fallback', async () => {
    const result = await generateRecipeFromIngredients({
      availableIngredients: 'Chickpeas, spinach, tomatoes, olive oil',
      dietaryPreference: 'vegetarian',
      servings: 4,
      maxCookingTime: 20
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.dietaryCategory, 'Vegetarian');
    assert.strictEqual(result.data.servings, 4);
    assert.ok(result.data.ingredients.some(i => i.name.toLowerCase().includes('chickpea')));
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
