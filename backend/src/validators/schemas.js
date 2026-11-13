const { z } = require('zod');

// ─── Recipe & Fridge-to-Recipe Schemas (Primary Feature) ─────────────

const RecipeIngredientSchema = z.object({
  id: z.string().default(() => `ing_${Math.random().toString(36).substring(2, 9)}`),
  name: z.string().min(1, 'Ingredient name cannot be empty'),
  quantity: z.number().positive('Quantity must be a positive number'),
  unit: z.string().min(1, 'Unit is required (e.g., grams, cups, tbsp, pieces)'),
  notes: z.string().optional().default(''),
  isPantryStaple: z.boolean().optional().default(false),
});

const RecipeInstructionSchema = z.object({
  stepNumber: z.number().int().positive('Step number must be a positive integer'),
  instruction: z.string().min(3, 'Instruction must be at least 3 characters'),
  tip: z.string().optional().default(''),
  timerMinutes: z.number().nonnegative().optional().default(0),
});

const RecipeSubstitutionSchema = z.object({
  originalIngredient: z.string().min(1, 'Original ingredient is required'),
  substituteIngredient: z.string().min(1, 'Substitute ingredient is required'),
  reasonOrRatio: z.string().min(1, 'Reason or conversion ratio is required'),
});

const EstimatedNutritionSchema = z.object({
  caloriesPerServing: z.number().nonnegative('Calories cannot be negative'),
  proteinGrams: z.number().nonnegative('Protein cannot be negative'),
  carbsGrams: z.number().nonnegative('Carbohydrates cannot be negative'),
  fatGrams: z.number().nonnegative('Fat cannot be negative'),
  fiberGrams: z.number().nonnegative().optional().default(0),
  disclaimer: z.string().default('Estimated values calculated by AI nutrition engine; not for medical diagnosis.'),
});

const RecipeSchema = z.object({
  id: z.string().default(() => `rcp_${Date.now()}`),
  name: z.string().min(2, 'Recipe name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  prepTimeMinutes: z.number().int().nonnegative('Prep time must be 0 or more'),
  cookTimeMinutes: z.number().int().nonnegative('Cook time must be 0 or more'),
  totalTimeMinutes: z.number().int().positive('Total time must be greater than 0'),
  servings: z.number().int().positive('Servings must be at least 1'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Easy'),
  cuisine: z.string().default('Contemporary'),
  dietaryCategory: z.string().default('Balanced'),
  ingredients: z.array(RecipeIngredientSchema).min(1, 'Recipe must include at least one ingredient'),
  instructions: z.array(RecipeInstructionSchema).min(1, 'Recipe must include at least one instruction step'),
  substitutions: z.array(RecipeSubstitutionSchema).default([]),
  estimatedNutrition: EstimatedNutritionSchema,
  cookingTips: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isAIGenerated: z.boolean().default(true),
  isFallback: z.boolean().default(false),
  fallbackReason: z.string().optional(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

const RecipeRequestSchema = z.object({
  availableIngredients: z.union([
    z.string().min(1, 'Available ingredients are required'),
    z.array(z.string()).min(1, 'At least one ingredient is required')
  ]),
  avoidIngredients: z.union([z.string(), z.array(z.string())]).optional().default(''),
  dietaryPreference: z.enum([
    'any', 'vegetarian', 'non_vegetarian', 'vegan', 'keto', 'high_protein', 'low_carb', 'mediterranean', 'gluten_free'
  ]).optional().default('any'),
  servings: z.number().int().min(1).max(20).optional().default(2),
  maxCookingTime: z.number().int().min(5).max(180).optional().default(30),
  allergies: z.union([z.string(), z.array(z.string())]).optional().default(''),
  cuisinePreference: z.string().optional().default('any'),
});

// ─── Workout Schemas ────────────────────────────────────────────────

const ExerciseSchema = z.object({
  id: z.string().default(() => `ex_${Math.random().toString(36).substring(2, 9)}`),
  name: z.string().min(1, 'Exercise name is required'),
  muscleGroup: z.string().min(1, 'Muscle group is required'),
  category: z.string().default('General'),
  sets: z.number().int().positive('Sets must be at least 1'),
  reps: z.union([z.string(), z.number()]),
  restSeconds: z.number().int().nonnegative('Rest seconds must be non-negative'),
  durationMinutes: z.number().nonnegative().default(8),
  difficulty: z.string().default('Intermediate'),
  equipment: z.array(z.string()).default(['Bodyweight']),
  instructions: z.array(z.string()).min(1, 'At least one instruction is required'),
  tips: z.string().optional().default(''),
  alternatives: z.array(z.string()).optional().default([]),
});

const WorkoutDaySchema = z.object({
  day: z.string(),
  focus: z.string(),
  isRestDay: z.boolean().default(false),
  durationMinutes: z.number().nonnegative(),
  exercises: z.array(ExerciseSchema).default([]),
});

const WorkoutPlanSchema = z.object({
  weeklyPlan: z.array(WorkoutDaySchema).min(1).max(7),
  isFallback: z.boolean().optional().default(false),
  aiNote: z.string().optional(),
});

// ─── Daily Meal Plan Schemas (Supporting Feature) ────────────────────

const FoodItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  swapOptions: z.string().optional().default(''),
});

const MealSchema = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string(),
  emoji: z.string().optional().default('🍽️'),
  servings: z.number().positive().default(1),
  totalCalories: z.number().nonnegative(),
  totalProtein: z.number().nonnegative(),
  totalCarbs: z.number().nonnegative(),
  totalFat: z.number().nonnegative(),
  foods: z.array(FoodItemSchema).default([]),
  instructions: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
});

const MealPlanSchema = z.object({
  meals: z.array(MealSchema).min(3).max(7),
  dailySummary: z.object({
    totalCalories: z.number().nonnegative(),
    totalProtein: z.number().nonnegative(),
    totalCarbs: z.number().nonnegative(),
    totalFat: z.number().nonnegative(),
  }),
  isFallback: z.boolean().optional().default(false),
  aiNote: z.string().optional(),
});

// ─── Schedule Schemas ───────────────────────────────────────────────

const ScheduleActivitySchema = z.object({
  id: z.string(),
  time: z.string(),
  activity: z.string(),
  description: z.string(),
  duration: z.number().nonnegative(),
  category: z.enum(['workout', 'nutrition', 'hydration', 'sleep', 'recovery', 'activity']).default('activity'),
  emoji: z.string().optional().default('⭐'),
  completed: z.boolean().default(false),
});

const DailyScheduleSchema = z.object({
  schedule: z.array(ScheduleActivitySchema).min(3),
  isFallback: z.boolean().optional().default(false),
});

// ─── AI Coach Schema ────────────────────────────────────────────────

const CoachResponseSchema = z.object({
  summary: z.string().min(5, 'Summary must be at least 5 characters'),
  actionSteps: z.array(z.string()).min(1, 'At least one action step is required'),
  nutritionTip: z.string().optional().default(''),
  workoutTip: z.string().optional().default(''),
  caution: z.string().default('General educational fitness and nutrition advice. Consult a healthcare provider before making major dietary or physical training adjustments.'),
  isFallback: z.boolean().optional().default(false),
});

// ─── Safe Validation Helpers (Return detailed errors) ────────────────

function validateRecipe(data) {
  return RecipeSchema.safeParse(data);
}

function validateRecipeRequest(data) {
  return RecipeRequestSchema.safeParse(data);
}

function validateWorkoutPlan(data) {
  return WorkoutPlanSchema.safeParse(data);
}

function validateMealPlan(data) {
  return MealPlanSchema.safeParse(data);
}

function validateDailySchedule(data) {
  return DailyScheduleSchema.safeParse(data);
}

function validateCoachResponse(data) {
  return CoachResponseSchema.safeParse(data);
}

module.exports = {
  RecipeIngredientSchema,
  RecipeInstructionSchema,
  RecipeSubstitutionSchema,
  EstimatedNutritionSchema,
  RecipeSchema,
  RecipeRequestSchema,
  WorkoutPlanSchema,
  MealPlanSchema,
  DailyScheduleSchema,
  CoachResponseSchema,
  validateRecipe,
  validateRecipeRequest,
  validateWorkoutPlan,
  validateMealPlan,
  validateDailySchedule,
  validateCoachResponse,
};
