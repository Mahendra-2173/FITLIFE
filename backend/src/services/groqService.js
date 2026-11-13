const path = require('path');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');
const {
  validateRecipe,
  validateWorkoutPlan,
  validateMealPlan,
  validateDailySchedule,
  validateCoachResponse,
} = require('../validators/schemas');

let groq = null;
let activeApiKey = null;

function getGroqClient() {
  let key = (process.env.GROQ_API_KEY || '').trim();

  // If key is missing or placeholder, attempt dynamic reload from backend/.env
  if (!key || key === 'your_groq_api_key_here' || key.length < 15) {
    try {
      const envPath = path.resolve(__dirname, '../../.env');
      dotenv.config({ path: envPath, override: true });
      key = (process.env.GROQ_API_KEY || '').trim();
    } catch (e) {}
  }

  const isInvalid = !key || key === 'your_groq_api_key_here' || key.length < 15;
  if (isInvalid) {
    return null;
  }

  if (!groq || activeApiKey !== key) {
    try {
      groq = new Groq({ apiKey: key });
      activeApiKey = key;
      console.log('[groqService] Initialized Groq client with key:', key.substring(0, 7) + '...');
    } catch (e) {
      console.warn('[groqService] Failed to initialize Groq client:', e.message);
      return null;
    }
  }

  return groq;
}

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

let cachedDiscoveredModels = null;
let lastDiscoveryTime = 0;

async function getAvailableModelList(client) {
  const now = Date.now();
  if (cachedDiscoveredModels && now - lastDiscoveryTime < 300000) {
    return cachedDiscoveredModels;
  }

  try {
    const list = await client.models.list();
    if (list && Array.isArray(list.data)) {
      const activeTextModels = list.data
        .map((m) => m.id)
        .filter((id) => !id.includes('whisper') && !id.includes('guard') && !id.includes('safeguard'));
      if (activeTextModels.length > 0) {
        cachedDiscoveredModels = activeTextModels;
        lastDiscoveryTime = now;
        console.log('[groqService] Live account models discovered:', activeTextModels.join(', '));
        return activeTextModels;
      }
    }
  } catch (e) {
    console.warn('[groqService] Could not dynamically fetch model list:', e.message);
  }

  return CANDIDATE_MODELS;
}

/**
 * Robust JSON extraction and syntax repair for LLM responses
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty AI response received from model');
  }

  // 1. Try markdown code block extraction
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let cleaned = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  // 2. Try to isolate outermost root JSON object or array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endChar = '}';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    }
  }

  // 3. Attempt direct JSON parse
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 4. Clean common JSON syntax mistakes from LLMs:
    let repaired = cleaned
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([}\]])/g, '$1')
      // Remove JavaScript comments
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Replace single quotes around keys or simple strings
      .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');

    try {
      return JSON.parse(repaired);
    } catch (err2) {
      console.warn('[extractJSON] Failed standard & repaired JSON parse. Raw preview:', cleaned.substring(0, 180));
      throw new Error(`Malformed JSON output from AI: ${err2.message}`);
    }
  }
}

/**
 * Core function to call Groq with timeout protection & AbortController
 */
async function callGroq(systemPrompt, userPrompt, maxTokens = 4096, timeoutMs = 25000) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq client is not configured or valid API key is missing. Set GROQ_API_KEY in backend/.env.');
  }

  const discovered = await getAvailableModelList(client);
  const modelsToTry = [...new Set([...(discovered || []), ...CANDIDATE_MODELS])];
  let lastError = null;

  for (const modelToUse of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[groqService] Requesting inference from model: ${modelToUse}`);
      const response = await client.chat.completions.create(
        {
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.6,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const content = response.choices[0]?.message?.content || '';
      if (!content.trim()) {
        throw new Error('Groq returned an empty response');
      }
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      // If model not found or decommissioned, cascade to next available model
      const isModelUnavailable =
        err.status === 404 ||
        err.status === 400 ||
        err.message?.includes('model_not_found') ||
        err.message?.includes('model_decommissioned') ||
        err.message?.includes('decommissioned') ||
        err.message?.includes('does not exist');

      if (isModelUnavailable) {
        console.warn(`[groqService] Model "${modelToUse}" unavailable (${err.message}). Trying next candidate...`);
        continue;
      }
      if (err.name === 'AbortError' || controller.signal.aborted) {
        throw new Error(`AI request timed out after ${timeoutMs / 1000} seconds`);
      }
      if (err.status === 401 || err.message?.includes('API key')) {
        throw new Error('Groq API authentication failed. Verify GROQ_API_KEY.');
      }
      if (err.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please wait a moment and try again.');
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate Groq models failed.');
}

// ─────────────────────────────────────────────────────────────────────
// 🍳 PRIMARY FEATURE: FRIDGE-TO-RECIPE GENERATOR
// ─────────────────────────────────────────────────────────────────────

/**
 * Generate a structured recipe from available fridge ingredients
 */
async function generateRecipeFromIngredients(options) {
  const {
    availableIngredients,
    avoidIngredients,
    dietaryPreference = 'any',
    servings = 2,
    maxCookingTime = 30,
    allergies = '',
    cuisinePreference = 'any',
  } = options;

  const ingredientsText = Array.isArray(availableIngredients)
    ? availableIngredients.join(', ')
    : availableIngredients;

  const avoidText = Array.isArray(avoidIngredients)
    ? avoidIngredients.join(', ')
    : avoidIngredients;

  const systemPrompt = `You are an elite executive chef and sports nutritionist.
Create a healthy, delicious, chef-grade recipe using ONLY the user's available ingredients, plus common kitchen staples (salt, pepper, cooking oil, basic spices, water).
CRITICAL: Output MUST be strictly valid JSON matching the exact schema below. Do not output markdown fences or conversational preambles outside the JSON.`;

  const userPrompt = `Generate a complete recipe based on these fridge & pantry contents:
- Available Ingredients in Fridge: ${ingredientsText}
- Ingredients to Avoid: ${avoidText || 'None'}
- Dietary Preference: ${dietaryPreference}
- Target Servings: ${servings}
- Maximum Cooking Time: ${maxCookingTime} minutes
- Allergies / Intolerances: ${allergies || 'None'}
- Preferred Cuisine: ${cuisinePreference}

Return ONLY this JSON structure:
{
  "id": "rcp_${Date.now()}",
  "name": "Seared Garlic Herb Chicken with Wilted Spinach",
  "description": "A vibrant, 20-minute Mediterranean skillet meal loaded with lean protein, iron-rich greens, and aromatic garlic.",
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "totalTimeMinutes": 25,
  "servings": ${servings},
  "difficulty": "Easy",
  "cuisine": "Mediterranean",
  "dietaryCategory": "${dietaryPreference === 'any' ? 'High-Protein Balanced' : dietaryPreference}",
  "ingredients": [
    {
      "id": "ing_1",
      "name": "Chicken Breast",
      "quantity": 300,
      "unit": "grams",
      "notes": "Skinless, sliced into 1-inch strips",
      "isPantryStaple": false
    },
    {
      "id": "ing_2",
      "name": "Fresh Spinach",
      "quantity": 150,
      "unit": "grams",
      "notes": "Washed and patted dry",
      "isPantryStaple": false
    },
    {
      "id": "ing_3",
      "name": "Olive Oil",
      "quantity": 1.5,
      "unit": "tbsp",
      "notes": "Extra virgin",
      "isPantryStaple": true
    }
  ],
  "instructions": [
    {
      "stepNumber": 1,
      "instruction": "Season chicken strips evenly with salt, cracked black pepper, and dried herbs.",
      "tip": "Patting the meat dry beforehand ensures a golden crust.",
      "timerMinutes": 0
    },
    {
      "stepNumber": 2,
      "instruction": "Heat 1 tbsp olive oil in a large skillet over medium-high heat. Sear chicken undisturbed for 4-5 minutes per side until golden and internal temperature reaches 75°C.",
      "tip": "Avoid overcrowding the pan to prevent steaming.",
      "timerMinutes": 8
    },
    {
      "stepNumber": 3,
      "instruction": "Add minced garlic and fresh spinach to the skillet. Toss gently for 90 seconds until the spinach is vibrant and just wilted.",
      "tip": "Remove from heat immediately to avoid overcooking the greens.",
      "timerMinutes": 2
    }
  ],
  "substitutions": [
    {
      "originalIngredient": "Chicken Breast",
      "substituteIngredient": "Firm Tofu or Salmon Fillet",
      "reasonOrRatio": "1:1 ratio for plant-based or omega-3 variation with similar cook time."
    },
    {
      "originalIngredient": "Fresh Spinach",
      "substituteIngredient": "Kale or Arugula",
      "reasonOrRatio": "1:1 ratio. If using kale, sauté for an extra 2 minutes."
    }
  ],
  "estimatedNutrition": {
    "caloriesPerServing": 380,
    "proteinGrams": 42,
    "carbsGrams": 6,
    "fatGrams": 18,
    "fiberGrams": 3,
    "disclaimer": "Estimated values calculated by AI nutrition engine; not for medical use."
  },
  "cookingTips": [
    "Let meat rest for 3 minutes before slicing to lock in natural juices.",
    "A squeeze of fresh lemon juice at the end brightens the garlic-herb profile."
  ],
  "tags": ["High-Protein", "Low-Carb", "Quick Weeknight", "Skillet Meal"],
  "isAIGenerated": true,
  "isFallback": false
}

RULES:
- Every quantity MUST be a valid number (e.g., 250, 1.5, 2). Never strings like 'to taste' in the quantity field.
- Units must be clear (e.g., grams, ml, cups, tbsp, tsp, pieces, cloves).
- Include realistic step timers (in minutes) where appropriate.
- Provide practical substitutions for the main ingredients.
- Keep total cooking time within ${maxCookingTime} minutes.`;

  try {
    const rawResponse = await callGroq(systemPrompt, userPrompt, 3500);
    const parsed = extractJSON(rawResponse);

    // Validate with Zod
    const validation = validateRecipe(parsed);
    if (!validation.success) {
      console.warn('[groqService] Recipe schema validation failed:', validation.error.format());
      throw new Error(`AI generated an invalid recipe structure: ${validation.error.issues.map(i => i.path.join('.') + ' (' + i.message + ')').join('; ')}`);
    }

    return {
      success: true,
      data: validation.data,
      isAIGenerated: true,
      isFallback: false,
    };
  } catch (err) {
    console.warn('[groqService] Using resilient validated fallback recipe due to:', err.message);
    const fallback = getFallbackRecipe(options, err.message);
    const validatedFallback = validateRecipe(fallback);
    if (!validatedFallback.success) {
      console.error('[groqService] Fallback recipe schema validation failed:', validatedFallback.error.format());
      throw new Error(`Fallback validation failed: ${validatedFallback.error.issues.map(i => i.message).join(', ')}`);
    }
    return {
      success: true,
      data: validatedFallback.data,
      isAIGenerated: false,
      isFallback: true,
      fallbackReason: err.message,
    };
  }
}

/**
 * Refine an existing recipe based on a follow-up user prompt
 */
async function refineRecipeWithPrompt(existingRecipe, refinementPrompt, options = {}) {
  const systemPrompt = `You are an expert chef specializing in recipe modification.
Update the provided recipe based on the user's specific request.
Output MUST be strictly valid JSON conforming to the exact Recipe schema. No markdown fences outside JSON.`;

  const userPrompt = `Here is the current recipe:
${JSON.stringify(existingRecipe, null, 2)}

User's Modification Request: "${refinementPrompt}"

Return the complete updated recipe JSON with modified ingredients, steps, timings, and nutrition estimates to reflect the requested adjustments.`;

  try {
    const rawResponse = await callGroq(systemPrompt, userPrompt, 3500);
    const parsed = extractJSON(rawResponse);
    const validation = validateRecipe(parsed);

    if (!validation.success) {
      throw new Error(`Refined recipe failed validation: ${validation.error.issues.map(i => i.message).join(', ')}`);
    }

    return {
      success: true,
      data: {
        ...validation.data,
        isAIGenerated: true,
        isFallback: false,
      },
    };
  } catch (err) {
    console.warn('[groqService] Recipe refinement failed:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 🏋️ WORKOUT GENERATOR
// ─────────────────────────────────────────────────────────────────────

async function generateWorkoutPlan(profile, customPrompt = '') {
  const systemPrompt = `You are a certified master fitness trainer. Generate weekly workout plans as strictly valid JSON only.`;

  const userPrompt = `Generate a personalized weekly workout plan:
- Goal: ${profile.goal || 'General Fitness'}
- Experience: ${profile.experience || 'Beginner'}
- Weight: ${profile.weight || 70}kg, Height: ${profile.height || 175}cm
- Workout Location: ${profile.workoutLocation || 'gym'}
- Available Equipment: ${profile.equipment?.join(', ') || 'Dumbbells, Bodyweight'}
- Workout Days Per Week: ${profile.workoutDaysPerWeek || 4}
- Preferred Duration: ${profile.preferredDuration || 45} minutes
- Limitations/Injuries: ${profile.limitations || 'None'}
${customPrompt ? `- Custom User Instructions: "${customPrompt}"` : ''}

Return ONLY this JSON structure:
{
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Upper Body Push & Core",
      "isRestDay": false,
      "durationMinutes": 45,
      "exercises": [
        {
          "id": "ex_mon_1",
          "name": "Dumbbell Bench Press",
          "muscleGroup": "Chest",
          "category": "Strength",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 75,
          "durationMinutes": 8,
          "difficulty": "Intermediate",
          "equipment": ["Dumbbells", "Bench"],
          "instructions": [
            "Lie flat with dumbbells at chest height, palms facing forward.",
            "Press weights upward with control without locking elbows.",
            "Lower slowly over 2-3 seconds back to chest height."
          ],
          "tips": "Plant feet firmly on the floor and brace your abdominal wall.",
          "alternatives": ["Push-ups", "Floor Press"]
        }
      ]
    }
  ]
}

Include exactly 7 days (Monday through Sunday). Exactly ${profile.workoutDaysPerWeek || 4} days should have isRestDay: false with 3-5 exercises each. The remaining days must have isRestDay: true and exercises: [].`;

  try {
    const raw = await callGroq(systemPrompt, userPrompt, 4500);
    const parsed = extractJSON(raw);
    const validation = validateWorkoutPlan(parsed);
    if (!validation.success) {
      throw new Error(`Workout plan failed validation: ${validation.error.issues.map(i => i.message).join('; ')}`);
    }
    return validation.data;
  } catch (err) {
    console.warn('[groqService] Using fallback workout plan due to:', err.message);
    return getFallbackWorkoutPlan(profile, customPrompt);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 🥗 SUPPORTING: DAILY MEAL PLAN
// ─────────────────────────────────────────────────────────────────────

async function generateMealPlan(profile, nutritionTargets, ingredientsList = '') {
  const systemPrompt = `You are a certified sports dietitian. Generate a complete 5-meal daily nutrition schedule as strictly valid JSON only.`;

  const userPrompt = `Generate a personalized daily meal plan:
- Target Calories: ${nutritionTargets?.calories || 2000} kcal
- Protein: ${nutritionTargets?.protein || 140}g, Carbs: ${nutritionTargets?.carbs || 200}g, Fat: ${nutritionTargets?.fat || 60}g
- Dietary Preference: ${profile.dietaryPreference || 'Non-Vegetarian'}
- Allergies: ${profile.allergies || 'None'}
${ingredientsList ? `- Available Fridge Ingredients: "${ingredientsList}"` : ''}

Return ONLY this JSON structure with 5 meals (Breakfast, Morning Snack, Lunch, Evening Snack, Dinner):
{
  "meals": [
    {
      "id": "m1",
      "name": "Breakfast",
      "time": "08:00 AM",
      "emoji": "🍳",
      "servings": 1,
      "totalCalories": 450,
      "totalProtein": 32,
      "totalCarbs": 45,
      "totalFat": 14,
      "foods": [
        {
          "name": "Scrambled Eggs with Spinach & Whole Wheat Toast",
          "quantity": "2 whole eggs + 2 whites, 1 cup spinach, 2 slices toast",
          "calories": 410,
          "protein": 28,
          "carbs": 40,
          "fat": 14,
          "swapOptions": "Swap eggs for 150g firm tofu scramble or Greek yogurt."
        }
      ],
      "instructions": [
        "Whisk eggs with a pinch of sea salt.",
        "Sauté spinach in 1 tsp olive oil for 1 minute.",
        "Add eggs and stir gently until fluffy."
      ],
      "notes": "Rich in choline, complete proteins, and slow-digesting carbs."
    }
  ],
  "dailySummary": {
    "totalCalories": ${nutritionTargets?.calories || 2000},
    "totalProtein": ${nutritionTargets?.protein || 140},
    "totalCarbs": ${nutritionTargets?.carbs || 200},
    "totalFat": ${nutritionTargets?.fat || 60}
  }
}`;

  try {
    const raw = await callGroq(systemPrompt, userPrompt, 4000);
    const parsed = extractJSON(raw);
    const validation = validateMealPlan(parsed);
    if (!validation.success) {
      throw new Error(`Meal plan validation failed: ${validation.error.issues.map(i => i.message).join('; ')}`);
    }
    return validation.data;
  } catch (err) {
    console.warn('[groqService] Using fallback meal plan due to:', err.message);
    return getFallbackMealPlan(profile, nutritionTargets);
  }
}

// ─────────────────────────────────────────────────────────────────────
// ⏱️ DAILY SCHEDULE & AI COACH
// ─────────────────────────────────────────────────────────────────────

async function generateDailySchedule(profile, workoutDay, customRoutine = '') {
  const systemPrompt = `You are a certified lifestyle coach. Generate daily wellness schedules as strictly valid JSON only.`;

  const userPrompt = `Generate a personalized daily fitness & routine timetable:
- Wakeup/Preferred workout time: ${profile.preferredWorkoutTime || 'morning'}
- Sleep target: ${profile.sleepDuration || 7.5} hours
- Activity level: ${profile.activityLevel || 'moderately_active'}
- Today's workout: ${workoutDay?.focus || 'Upper Body Strength (45 min)'}
${customRoutine ? `- User Day Schedule Context: "${customRoutine}"` : ''}

Return ONLY this JSON:
{
  "schedule": [
    {
      "id": "act_1",
      "time": "06:30 AM",
      "activity": "Hydration & Morning Mobility",
      "description": "Drink 500ml water with lemon, 5 mins of spine and hip mobility.",
      "duration": 15,
      "category": "hydration",
      "emoji": "💧",
      "completed": false
    },
    {
      "id": "act_2",
      "time": "07:00 AM",
      "activity": "Morning Workout Session",
      "description": "${workoutDay?.focus || 'Strength & Conditioning Workout'}",
      "duration": 45,
      "category": "workout",
      "emoji": "🏋️",
      "completed": false
    },
    {
      "id": "act_3",
      "time": "08:15 AM",
      "activity": "High-Protein Breakfast",
      "description": "Fuel recovery with complex carbs and 30g+ protein.",
      "duration": 30,
      "category": "nutrition",
      "emoji": "🍳",
      "completed": false
    },
    {
      "id": "act_4",
      "time": "01:00 PM",
      "activity": "Balanced Lunch",
      "description": "Wholesome lunch with lean protein, fiber, and clean carbs.",
      "duration": 40,
      "category": "nutrition",
      "emoji": "🥗",
      "completed": false
    },
    {
      "id": "act_5",
      "time": "05:30 PM",
      "activity": "Sunset Walk & Step Count",
      "description": "25-minute brisk walk for active recovery.",
      "duration": 25,
      "category": "recovery",
      "emoji": "🚶",
      "completed": false
    },
    {
      "id": "act_6",
      "time": "08:00 PM",
      "activity": "Dinner",
      "description": "Light, nutrient-dense dinner with fiber and protein.",
      "duration": 40,
      "category": "nutrition",
      "emoji": "🍲",
      "completed": false
    },
    {
      "id": "act_7",
      "time": "10:00 PM",
      "activity": "Sleep Preparation",
      "description": "Turn off blue screens, stretch, and relax for deep sleep.",
      "duration": 30,
      "category": "sleep",
      "emoji": "🌙",
      "completed": false
    }
  ]
}`;

  try {
    const raw = await callGroq(systemPrompt, userPrompt, 3000);
    const parsed = extractJSON(raw);
    const validation = validateDailySchedule(parsed);
    if (!validation.success) {
      throw new Error(`Schedule validation failed: ${validation.error.issues.map(i => i.message).join('; ')}`);
    }
    return validation.data;
  } catch (err) {
    console.warn('[groqService] Using fallback daily schedule:', err.message);
    return getFallbackSchedule();
  }
}

async function askCoach(question, profile, currentPlan) {
  const systemPrompt = `You are FitLife AI, a certified elite personal trainer and sports nutritionist.
Provide structured, evidence-based responses as strictly valid JSON only. Do not output raw chat text.`;

  const userPrompt = `User question: "${question}"
User Context:
- Goal: ${profile?.goal || 'General Fitness'}
- Experience: ${profile?.experience || 'Beginner'}
- Diet: ${profile?.dietaryPreference || 'Any'}
- Weight: ${profile?.weight || 70}kg, Height: ${profile?.height || 175}cm

Return ONLY this JSON structure:
{
  "summary": "Direct, empathetic, 2-sentence executive answer to the question.",
  "actionSteps": [
    "Step 1: Specific concrete action item",
    "Step 2: Specific concrete action item",
    "Step 3: Specific concrete action item"
  ],
  "nutritionTip": "Targeted nutrition or hydration advice relating to the query.",
  "workoutTip": "Targeted exercise form, programming, or recovery advice.",
  "caution": "Important safety limitation or disclaimer (not medical advice)."
}`;

  try {
    const raw = await callGroq(systemPrompt, userPrompt, 1800);
    const parsed = extractJSON(raw);
    const validation = validateCoachResponse(parsed);
    if (!validation.success) {
      throw new Error(`Coach response validation failed: ${validation.error.issues.map(i => i.message).join('; ')}`);
    }
    return validation.data;
  } catch (err) {
    console.warn('[groqService] Using fallback coach response:', err.message);
    return {
      summary: `Here is coach advice for "${question}": Consistency and progressive overload paired with adequate protein and sleep will deliver 80% of your results.`,
      actionSteps: [
        "Track your daily sets and aim for 1-2 more reps or slight weight increase each week.",
        "Prioritize 1.6g to 2.2g of protein per kg of bodyweight spread across your meals.",
        "Ensure 7 to 8 hours of uninterrupted sleep for neuromuscular recovery."
      ],
      nutritionTip: "Stay hydrated by consuming at least 2.5-3 liters of water daily, especially around your workout window.",
      workoutTip: "Focus on controlled eccentrics (2-3 seconds lowering) to maximize muscle tension while protecting joints.",
      caution: "This guidance is for general fitness education. Consult a healthcare provider before changing exercise intensity if you have pre-existing conditions.",
      isFallback: true,
    };
  }
}

async function refineExercise(exercise, reason, profile) {
  const systemPrompt = `You are a master personal trainer. Provide exercise replacement alternatives as strictly valid JSON only.`;

  const userPrompt = `Provide 3 suitable replacement exercises for "${exercise.name}" (Muscle group: ${exercise.muscleGroup || 'Full Body'}).
Reason for replacement: ${reason}.
User: ${profile.experience || 'Intermediate'} level, equipment: ${profile.equipment?.join(', ') || 'All standard'}.

Return ONLY this JSON:
{
  "alternatives": [
    {
      "id": "alt_1",
      "name": "Dumbbell Floor Press",
      "muscleGroup": "${exercise.muscleGroup || 'Chest'}",
      "category": "Strength",
      "sets": 3,
      "reps": "10-12",
      "restSeconds": 60,
      "durationMinutes": 8,
      "difficulty": "Beginner",
      "equipment": ["Dumbbells"],
      "instructions": [
        "Lie flat on the floor with knees bent and feet flat.",
        "Hold dumbbells at chest height with elbows touching the floor at a 45-degree angle.",
        "Press dumbbells upward until arms are straight, then lower slowly until upper arms lightly touch the floor."
      ],
      "tips": "The floor prevents hyperextension of shoulders, making this safe for joint discomfort.",
      "alternatives": []
    }
  ]
}`;

  try {
    const raw = await callGroq(systemPrompt, userPrompt, 2000);
    return extractJSON(raw);
  } catch (err) {
    return {
      alternatives: [
        {
          id: 'alt_fb_1',
          name: `Modified ${exercise.name || 'Bodyweight Alternative'}`,
          muscleGroup: exercise.muscleGroup || 'Full Body',
          category: 'Low Impact',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          durationMinutes: 8,
          difficulty: 'Beginner',
          equipment: ['Bodyweight'],
          instructions: [
            'Perform movement with slow, controlled tempo focusing on contraction.',
            'Maintain a neutral spine and engage core throughout the movement.',
            'Rest 60 seconds between sets.'
          ],
          tips: 'Controlled tempo protects joints while keeping muscle fibers engaged.',
          alternatives: []
        }
      ]
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 📦 VALIDATED FALLBACK TEMPLATES
// ─────────────────────────────────────────────────────────────────────

function getFallbackRecipe(options, failureReason) {
  const servings = options.servings || 2;
  const isVeg = options.dietaryPreference === 'vegetarian' || options.dietaryPreference === 'vegan';

  if (isVeg) {
    return {
      id: `rcp_fb_${Date.now()}`,
      name: "Mediterranean Chickpea & Spinach Power Skillet",
      description: "A fast, protein-dense vegetarian skillet combining savory chickpeas, wilted baby spinach, aromatic garlic, and toasted cumin.",
      prepTimeMinutes: 8,
      cookTimeMinutes: 12,
      totalTimeMinutes: 20,
      servings: servings,
      difficulty: "Easy",
      cuisine: "Mediterranean",
      dietaryCategory: "Vegetarian",
      ingredients: [
        { id: "ing_1", name: "Canned Chickpeas", quantity: 240 * (servings / 2), unit: "grams", notes: "Rinsed and thoroughly drained", isPantryStaple: false },
        { id: "ing_2", name: "Fresh Baby Spinach", quantity: 150 * (servings / 2), unit: "grams", notes: "Washed and stemmed", isPantryStaple: false },
        { id: "ing_3", name: "Garlic Cloves", quantity: 3 * (servings / 2), unit: "cloves", notes: "Finely minced", isPantryStaple: true },
        { id: "ing_4", name: "Olive Oil", quantity: 1.5 * (servings / 2), unit: "tbsp", notes: "Extra virgin", isPantryStaple: true },
        { id: "ing_5", name: "Ground Cumin & Paprika", quantity: 1 * (servings / 2), unit: "tsp", notes: "Half cumin, half smoked paprika", isPantryStaple: true }
      ],
      instructions: [
        { stepNumber: 1, instruction: "Heat olive oil in a skillet over medium heat. Add minced garlic, cumin, and paprika; toast for 45 seconds until fragrant.", tip: "Watch closely so garlic does not scorch.", timerMinutes: 1 },
        { stepNumber: 2, instruction: "Toss in drained chickpeas and pinch of salt. Sauté for 6-8 minutes, stirring frequently until edges crisp up.", tip: "Drying chickpeas with a paper towel ensures a crispier texture.", timerMinutes: 7 },
        { stepNumber: 3, instruction: "Fold in baby spinach by handfuls. Stir gently until completely wilted (about 2 minutes). Remove from heat.", tip: "Finish with a squeeze of fresh lemon juice.", timerMinutes: 2 }
      ],
      substitutions: [
        { originalIngredient: "Chickpeas", substituteIngredient: "Canned Black Beans or Firm Tofu", reasonOrRatio: "1:1 ratio with identical cook time." },
        { originalIngredient: "Baby Spinach", substituteIngredient: "Chopped Swiss Chard or Kale", reasonOrRatio: "1:1 ratio. Cook chard/kale 2 minutes longer." }
      ],
      estimatedNutrition: {
        caloriesPerServing: 320,
        proteinGrams: 16,
        carbsGrams: 38,
        fatGrams: 12,
        fiberGrams: 9,
        disclaimer: "Estimated values calculated by AI nutrition engine; not for medical diagnosis."
      },
      cookingTips: [
        "Top with toasted pumpkin seeds or crumbled feta cheese for added texture and richness.",
        "Store leftovers in an airtight glass container for up to 3 days in the fridge."
      ],
      tags: ["High-Fiber", "Plant-Based", "Under 25 Mins", "Gluten-Free"],
      isAIGenerated: false,
      isFallback: true,
      fallbackReason: failureReason || "Offline template loaded because AI service is unavailable."
    };
  }

  return {
    id: `rcp_fb_${Date.now()}`,
    name: "Crispy Garlic-Herb Chicken & Sautéed Greens",
    description: "Juicy, golden seared chicken breasts served over garlic-infused wilted greens. High in lean protein and ultra-satisfying.",
    prepTimeMinutes: 10,
    cookTimeMinutes: 14,
    totalTimeMinutes: 24,
    servings: servings,
    difficulty: "Easy",
    cuisine: "Contemporary American",
    dietaryCategory: "High-Protein",
    ingredients: [
      { id: "ing_1", name: "Chicken Breast", quantity: 300 * (servings / 2), unit: "grams", notes: "Cut into 1-inch cutlets for quick cooking", isPantryStaple: false },
      { id: "ing_2", name: "Fresh Spinach or Mixed Greens", quantity: 180 * (servings / 2), unit: "grams", notes: "Washed thoroughly", isPantryStaple: false },
      { id: "ing_3", name: "Garlic Cloves", quantity: 3 * (servings / 2), unit: "cloves", notes: "Thinly sliced", isPantryStaple: true },
      { id: "ing_4", name: "Olive Oil", quantity: 1.5 * (servings / 2), unit: "tbsp", notes: "Divided", isPantryStaple: true },
      { id: "ing_5", name: "Dried Italian Oregano & Thyme", quantity: 1 * (servings / 2), unit: "tsp", notes: "Crushed between palms", isPantryStaple: true }
    ],
    instructions: [
      { stepNumber: 1, instruction: "Pat chicken dry with paper towels. Season both sides generously with salt, black pepper, and dried herbs.", tip: "Dry meat browns significantly better.", timerMinutes: 0 },
      { stepNumber: 2, instruction: "Heat 1 tbsp olive oil in a non-stick or cast-iron pan over medium-high heat. Add chicken and sear for 5-6 minutes per side until golden brown and internal temperature is 75°C.", tip: "Do not move chicken during the first 4 minutes to develop a sear.", timerMinutes: 10 },
      { stepNumber: 3, instruction: "Transfer chicken to a plate to rest. Lower heat to medium, add remaining oil and sliced garlic; cook 30 seconds. Add greens and toss until wilted (about 90 seconds).", tip: "Deglaze pan with 1 tbsp water to capture flavorful pan drippings.", timerMinutes: 2 }
    ],
    substitutions: [
      { originalIngredient: "Chicken Breast", substituteIngredient: "Salmon Fillet or Turkey Cutlets", reasonOrRatio: "1:1 ratio. Sear salmon skin-side down for 4 minutes." },
      { originalIngredient: "Spinach", substituteIngredient: "Steamed Broccoli Florets or Green Beans", reasonOrRatio: "1:1 ratio. Steam broccoli 4 minutes prior to tossing with garlic." }
    ],
    estimatedNutrition: {
      caloriesPerServing: 360,
      proteinGrams: 42,
      carbsGrams: 4,
      fatGrams: 16,
      fiberGrams: 2,
      disclaimer: "Estimated values calculated by AI nutrition engine; not for medical diagnosis."
    },
    cookingTips: [
      "Always allow chicken to rest for 3 minutes before cutting so juices redistribute throughout the cutlet.",
      "Pair with brown rice, quinoa, or roasted sweet potato wedges if you need additional pre-workout carbohydrates."
    ],
    tags: ["High-Protein", "Low-Carb", "Keto-Friendly", "Under 30 Mins"],
    isAIGenerated: false,
    isFallback: true,
    fallbackReason: failureReason || "Offline template loaded because AI service is unavailable."
  };
}

function getFallbackWorkoutPlan(profile, customPrompt) {
  const workoutCount = profile?.workoutDaysPerWeek || 4;
  const sampleSplits = [
    { day: 'Monday', focus: 'Upper Body Push (Chest, Shoulders, Triceps)', rest: false },
    { day: 'Tuesday', focus: 'Lower Body Strength (Quads, Hamstrings, Glutes)', rest: false },
    { day: 'Wednesday', focus: 'Active Recovery & Core Stability', rest: workoutCount <= 4 },
    { day: 'Thursday', focus: 'Upper Body Pull (Back, Rear Delts, Biceps)', rest: false },
    { day: 'Friday', focus: 'Full Body Functional & Conditioning', rest: workoutCount < 5 },
    { day: 'Saturday', focus: 'Cardio, Mobility & Core Flow', rest: workoutCount < 6 },
    { day: 'Sunday', focus: 'Full Rest & Muscle Rejuvenation', rest: true }
  ];

  const weeklyPlan = sampleSplits.map((item, idx) => {
    if (item.rest) {
      return {
        day: item.day,
        focus: 'Active Rest & Recovery',
        isRestDay: true,
        durationMinutes: 20,
        exercises: []
      };
    }

    return {
      day: item.day,
      focus: item.focus,
      isRestDay: false,
      durationMinutes: profile?.preferredDuration || 45,
      exercises: [
        {
          id: `ex_${idx}_1`,
          name: idx % 2 === 0 ? 'Dumbbell Bench Press' : 'Goblet Squats',
          muscleGroup: idx % 2 === 0 ? 'Chest' : 'Quadriceps',
          category: 'Compound',
          sets: 3,
          reps: '10-12',
          restSeconds: 75,
          durationMinutes: 8,
          difficulty: 'Intermediate',
          equipment: ['Dumbbells'],
          instructions: [
            'Set your stance with feet shoulder-width apart.',
            'Engage core and perform the movement with controlled 3-second descent.',
            'Drive through the heels/palms back to starting position.'
          ],
          tips: 'Keep core tight and breathe out on exertion.',
          alternatives: ['Push-ups', 'Bodyweight Squats']
        },
        {
          id: `ex_${idx}_2`,
          name: idx % 2 === 0 ? 'Dumbbell Bent-Over Row' : 'Romanian Deadlifts',
          muscleGroup: idx % 2 === 0 ? 'Back' : 'Hamstrings',
          category: 'Compound',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          durationMinutes: 8,
          difficulty: 'Intermediate',
          equipment: ['Dumbbells'],
          instructions: [
            'Hinge at your hips while maintaining a straight back.',
            'Pull the dumbbells smoothly toward your lower ribcage.',
            'Squeeze your shoulder blades together at the peak for 1 second.'
          ],
          tips: 'Avoid momentum; keep your head in neutral alignment.',
          alternatives: ['Resistance Band Rows', 'Single-Leg RDL']
        },
        {
          id: `ex_${idx}_3`,
          name: 'Plank with Shoulder Taps',
          muscleGroup: 'Core',
          category: 'Core Stability',
          sets: 3,
          reps: '16 taps',
          restSeconds: 45,
          durationMinutes: 6,
          difficulty: 'Beginner',
          equipment: ['Bodyweight'],
          instructions: [
            'Start in a solid high-plank position.',
            'Slowly tap your left shoulder with your right hand without rotating hips.',
            'Alternate sides smoothly while bracing your abdominal wall.'
          ],
          tips: 'Widen feet to increase pelvic stability.',
          alternatives: ['Standard Plank', 'Dead Bug']
        }
      ]
    };
  });

  return {
    weeklyPlan,
    isFallback: true,
    aiNote: 'Generated with resilient offline template for guaranteed reliability.'
  };
}

function getFallbackMealPlan(profile, targets) {
  const cals = targets?.calories || 2000;
  return {
    meals: [
      {
        id: 'm1',
        name: 'Breakfast',
        time: '08:00 AM',
        emoji: '🍳',
        servings: 1,
        totalCalories: Math.round(cals * 0.28),
        totalProtein: Math.round((targets?.protein || 140) * 0.25),
        totalCarbs: Math.round((targets?.carbs || 200) * 0.3),
        totalFat: Math.round((targets?.fat || 60) * 0.25),
        foods: [
          {
            name: 'Protein Oatmeal with Berries & Chia',
            quantity: '60g rolled oats, 1 scoop protein powder, 1/2 cup blueberries, 1 tbsp chia',
            calories: Math.round(cals * 0.28),
            protein: Math.round((targets?.protein || 140) * 0.25),
            carbs: Math.round((targets?.carbs || 200) * 0.3),
            fat: Math.round((targets?.fat || 60) * 0.25),
            swapOptions: 'Replace protein powder with 150g Greek yogurt or egg whites.'
          }
        ],
        instructions: [
          'Cook rolled oats in 200ml hot water or milk for 3 minutes.',
          'Stir in protein powder after heat is off to prevent clumping.',
          'Top with fresh blueberries and chia seeds.'
        ],
        notes: 'Sustained low-GI carbohydrates paired with fast-digesting protein.'
      },
      {
        id: 'm2',
        name: 'Morning Snack',
        time: '11:00 AM',
        emoji: '🍏',
        servings: 1,
        totalCalories: Math.round(cals * 0.12),
        totalProtein: 10,
        totalCarbs: 25,
        totalFat: 8,
        foods: [
          {
            name: 'Apple Slices with Peanut Butter',
            quantity: '1 crisp green apple, 1.5 tbsp natural peanut butter',
            calories: Math.round(cals * 0.12),
            protein: 10,
            carbs: 25,
            fat: 8,
            swapOptions: 'Swap peanut butter for almond butter or string cheese.'
          }
        ],
        instructions: ['Slice fresh apple and serve with natural unsweetened peanut butter.'],
        notes: 'Fiber and healthy mono-unsaturated fats to curb mid-morning hunger.'
      },
      {
        id: 'm3',
        name: 'Lunch',
        time: '01:30 PM',
        emoji: '🥗',
        servings: 1,
        totalCalories: Math.round(cals * 0.32),
        totalProtein: Math.round((targets?.protein || 140) * 0.35),
        totalCarbs: Math.round((targets?.carbs || 200) * 0.35),
        totalFat: Math.round((targets?.fat || 60) * 0.3),
        foods: [
          {
            name: 'Grilled Herb Chicken & Quinoa Mediterranean Bowl',
            quantity: '160g chicken breast (or tofu), 1 cup cooked quinoa, mixed bell peppers, cucumber, 1 tbsp olive oil',
            calories: Math.round(cals * 0.32),
            protein: Math.round((targets?.protein || 140) * 0.35),
            carbs: Math.round((targets?.carbs || 200) * 0.35),
            fat: Math.round((targets?.fat || 60) * 0.3),
            swapOptions: 'Swap chicken for 180g paneer, tofu, or wild caught salmon.'
          }
        ],
        instructions: [
          'Season chicken/tofu with oregano, garlic powder, and lemon juice.',
          'Grill for 5-6 mins per side until cooked through.',
          'Toss with warm quinoa, chopped cucumbers, cherry tomatoes, and olive oil.'
        ],
        notes: 'Complete essential amino acid profile with micronutrient density.'
      },
      {
        id: 'm4',
        name: 'Evening Snack',
        time: '05:00 PM',
        emoji: '🥜',
        servings: 1,
        totalCalories: Math.round(cals * 0.08),
        totalProtein: 12,
        totalCarbs: 10,
        totalFat: 5,
        foods: [
          {
            name: 'Greek Yogurt with Crushed Walnuts',
            quantity: '150g plain low-fat Greek yogurt, 10g walnuts, dash of cinnamon',
            calories: Math.round(cals * 0.08),
            protein: 12,
            carbs: 10,
            fat: 5,
            swapOptions: 'Swap for edamame pods or a boiled egg.'
          }
        ],
        instructions: ['Spoon Greek yogurt into a bowl, sprinkle crushed walnuts and cinnamon.'],
        notes: 'Pre-workout or post-work energy stabilizer.'
      },
      {
        id: 'm5',
        name: 'Dinner',
        time: '08:00 PM',
        emoji: '🍲',
        servings: 1,
        totalCalories: Math.round(cals * 0.2),
        totalProtein: Math.round((targets?.protein || 140) * 0.25),
        totalCarbs: Math.round((targets?.carbs || 200) * 0.2),
        totalFat: Math.round((targets?.fat || 60) * 0.2),
        foods: [
          {
            name: 'Baked White Fish with Roasted Broccoli & Sweet Potato',
            quantity: '160g white fish fillet (or tempeh), 150g steamed broccoli, 100g roasted sweet potato',
            calories: Math.round(cals * 0.2),
            protein: Math.round((targets?.protein || 140) * 0.25),
            carbs: Math.round((targets?.carbs || 200) * 0.2),
            fat: Math.round((targets?.fat || 60) * 0.2),
            swapOptions: 'Swap fish for lentils, tempeh, or turkey breast.'
          }
        ],
        instructions: [
          'Preheat oven to 200°C. Cube sweet potatoes and toss with spices.',
          'Bake sweet potatoes for 20 mins; add fish and broccoli for final 12 mins.',
          'Garnish with fresh lemon zest and cracked pepper.'
        ],
        notes: 'Easily digestible protein and complex carbs to encourage nocturnal recovery.'
      }
    ],
    dailySummary: {
      totalCalories: cals,
      totalProtein: targets?.protein || 140,
      totalCarbs: targets?.carbs || 200,
      totalFat: targets?.fat || 60
    },
    isFallback: true
  };
}

function getFallbackSchedule() {
  return {
    schedule: [
      { id: 'act_1', time: '06:30 AM', activity: 'Hydration & Morning Mobility', description: '500ml water + dynamic mobility routine', duration: 15, category: 'hydration', emoji: '💧', completed: false },
      { id: 'act_2', time: '07:00 AM', activity: 'Main Workout Session', description: 'Core lifting or cardio interval training', duration: 45, category: 'workout', emoji: '🏋️', completed: false },
      { id: 'act_3', time: '08:15 AM', activity: 'Nutrient-Dense Breakfast', description: 'High protein breakfast to stimulate muscle protein synthesis', duration: 30, category: 'nutrition', emoji: '🍳', completed: false },
      { id: 'act_4', time: '01:00 PM', activity: 'Wholesome Lunch', description: 'Lean protein, clean carbs, and colorful greens', duration: 40, category: 'nutrition', emoji: '🥗', completed: false },
      { id: 'act_5', time: '05:30 PM', activity: 'Sunset Walk / Active Movement', description: '20-30 min brisk walk for metabolic health and step goal', duration: 30, category: 'recovery', emoji: '🚶', completed: false },
      { id: 'act_6', time: '07:45 PM', activity: 'Nourishing Dinner', description: 'Light protein and fibrous vegetables', duration: 40, category: 'nutrition', emoji: '🍲', completed: false },
      { id: 'act_7', time: '10:00 PM', activity: 'Sleep Preparation', description: 'Dim room, reading, meditation for deep restorative rest', duration: 30, category: 'sleep', emoji: '🌙', completed: false }
    ],
    isFallback: true
  };
}

module.exports = {
  extractJSON,
  getFallbackRecipe,
  generateRecipeFromIngredients,
  refineRecipeWithPrompt,
  generateWorkoutPlan,
  generateMealPlan,
  generateDailySchedule,
  askCoach,
  refineExercise,
};
