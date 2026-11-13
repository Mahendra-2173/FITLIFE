const express = require('express');
const router = express.Router();
const {
  generateRecipeFromIngredients,
  refineRecipeWithPrompt,
  generateMealPlan,
} = require('../services/groqService');
const {
  validateRecipeRequest,
  validateMealPlan,
} = require('../validators/schemas');
const {
  getMacroTargets,
  getCalorieTarget,
  calculateTDEE,
  calculateBMR,
} = require('../services/calculators');

let lastGeneratedRecipe = null;
const favoriteRecipes = [];
let mealPlanStore = null;

// ─────────────────────────────────────────────────────────────────────
// 🍳 PRIMARY ASSIGNMENT FEATURE: FRIDGE-TO-RECIPE ROUTES
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/nutrition/recipe/generate
 * Takes available ingredients, avoidances, dietary preferences, servings, cooking time
 * Returns structured, validated recipe object
 */
router.post('/recipe/generate', async (req, res) => {
  try {
    // 1. Validate request shape
    const requestValidation = validateRecipeRequest(req.body);
    if (!requestValidation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipe request parameters',
        details: requestValidation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const options = requestValidation.data;
    console.log('[recipe/generate] Request received for ingredients:', options.availableIngredients);

    // 2. Call AI service with built-in validation & timeout protection
    const result = await generateRecipeFromIngredients(options);

    const recipePayload = {
      ...result.data,
      isAIGenerated: result.isAIGenerated,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason || null,
    };
    lastGeneratedRecipe = recipePayload;

    return res.status(200).json({
      success: true,
      data: recipePayload,
      isAIGenerated: result.isAIGenerated,
      isFallback: result.isFallback,
      fallbackReason: result.fallbackReason || null,
    });
  } catch (err) {
    console.error('[recipe/generate] Unhandled error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate recipe from ingredients',
    });
  }
});

/**
 * POST /api/nutrition/recipe/refine
 * Takes existing recipe + user follow-up prompt
 * Returns modified structured recipe
 */
router.post('/recipe/refine', async (req, res) => {
  try {
    const { recipe, refinementPrompt } = req.body;
    if (!recipe || !recipe.name) {
      return res.status(400).json({ success: false, error: 'Valid existing recipe is required' });
    }
    if (!refinementPrompt || typeof refinementPrompt !== 'string' || !refinementPrompt.trim()) {
      return res.status(400).json({ success: false, error: 'Refinement prompt cannot be empty' });
    }

    console.log('[recipe/refine] Refining recipe:', recipe.name, 'with prompt:', refinementPrompt);
    const result = await refineRecipeWithPrompt(recipe, refinementPrompt.trim());

    lastGeneratedRecipe = result.data;
    return res.json({
      success: true,
      data: result.data,
      isAIGenerated: true,
      isFallback: false,
    });
  } catch (err) {
    console.error('[recipe/refine] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to refine recipe with AI',
    });
  }
});

/**
 * GET /api/nutrition/recipe/last
 * Returns the most recently generated recipe
 */
router.get('/recipe/last', (req, res) => {
  if (!lastGeneratedRecipe) {
    return res.status(404).json({ success: false, error: 'No recipe has been generated yet' });
  }
  return res.json({ success: true, data: lastGeneratedRecipe });
});

/**
 * GET /api/nutrition/recipe/favorites
 * Returns user saved/favorite recipes
 */
router.get('/recipe/favorites', (req, res) => {
  return res.json({ success: true, data: favoriteRecipes });
});

/**
 * POST /api/nutrition/recipe/favorites
 * Saves a recipe to favorites list
 */
router.post('/recipe/favorites', (req, res) => {
  try {
    const recipe = req.body;
    if (!recipe || !recipe.id || !recipe.name) {
      return res.status(400).json({ success: false, error: 'Invalid recipe data' });
    }
    const existingIndex = favoriteRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      favoriteRecipes[existingIndex] = recipe;
    } else {
      favoriteRecipes.unshift(recipe);
    }
    return res.json({ success: true, message: 'Recipe saved to favorites', data: favoriteRecipes });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to save favorite recipe' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🥗 SUPPORTING FEATURE: DAILY MEAL PLAN ROUTES
// ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/nutrition/generate & POST /api/nutrition/mealplan/generate
 */
const handleMealPlanGenerate = async (req, res) => {
  try {
    const { profile, ingredientsList } = req.body;
    const userProfile = profile || req.body;
    if (!userProfile || !userProfile.weight) {
      return res.status(400).json({ success: false, error: 'User profile with weight is required' });
    }

    const bmr = calculateBMR(userProfile.weight, userProfile.height || 175, userProfile.age || 25, userProfile.gender || 'male');
    const tdee = calculateTDEE(bmr, userProfile.activityLevel || 'moderately_active');
    const { calories } = getCalorieTarget(tdee, userProfile.goal || 'general_fitness');
    const macros = getMacroTargets(calories, userProfile.goal || 'general_fitness', userProfile.weight);

    const nutritionTargets = { calories, ...macros };
    const validatedPlan = await generateMealPlan(userProfile, nutritionTargets, ingredientsList);

    mealPlanStore = { ...validatedPlan, nutritionTargets };
    return res.json({ success: true, data: mealPlanStore });
  } catch (err) {
    console.error('[nutrition/generate]', err);
    return res.status(500).json({ success: false, error: 'Failed to generate meal plan. Please try again.' });
  }
};

router.post('/generate', handleMealPlanGenerate);
router.post('/mealplan/generate', handleMealPlanGenerate);

/**
 * GET /api/nutrition/plan
 */
router.get('/plan', (req, res) => {
  if (!mealPlanStore) {
    return res.status(404).json({ success: false, error: 'No meal plan generated yet' });
  }
  return res.json({ success: true, data: mealPlanStore });
});

module.exports = router;
