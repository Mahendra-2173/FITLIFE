import { createContext, useContext, useState, useEffect } from 'react';

const NutritionContext = createContext(null);
const RECIPE_KEY = 'fitlife_current_recipe';
const FAVORITES_KEY = 'fitlife_favorite_recipes';
const PLAN_KEY = 'fitlife_meal_plan';
const WATER_KEY = 'fitlife_water_today';
const WATER_HISTORY_KEY = 'fitlife_water_history';
const COMPLETED_MEALS_KEY = 'fitlife_completed_meals';
const LOGGED_MEALS_KEY = 'fitlife_logged_meals';

export function NutritionProvider({ children }) {
  const [currentRecipe, setCurrentRecipeState] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [completedMeals, setCompletedMeals] = useState([]);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterTarget, setWaterTarget] = useState(2.8);
  const [waterHistory, setWaterHistory] = useState([]);

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      // Load current recipe
      const savedRecipe = localStorage.getItem(RECIPE_KEY);
      if (savedRecipe) {
        setCurrentRecipeState(JSON.parse(savedRecipe));
      }

      // Load favorites
      const savedFavs = localStorage.getItem(FAVORITES_KEY);
      if (savedFavs) {
        setSavedRecipes(JSON.parse(savedFavs));
      }

      // Load meal plan
      const savedPlan = localStorage.getItem(PLAN_KEY);
      if (savedPlan) {
        setMealPlan(JSON.parse(savedPlan));
      }

      // Load today's water intake
      const today = getTodayKey();
      const waterData = localStorage.getItem(WATER_KEY);
      if (waterData) {
        const parsed = JSON.parse(waterData);
        if (parsed.date === today) {
          setWaterIntake(parsed.amount);
        } else {
          setWaterIntake(0);
        }
      }

      // Load water history
      const savedWaterHistory = localStorage.getItem(WATER_HISTORY_KEY);
      if (savedWaterHistory) {
        setWaterHistory(JSON.parse(savedWaterHistory));
      }

      // Load today's completed meals
      const savedCompleted = localStorage.getItem(COMPLETED_MEALS_KEY);
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        if (parsed.date === today && Array.isArray(parsed.meals)) {
          setCompletedMeals(parsed.meals);
        }
      }

      // Load today's logged meals
      const savedLogged = localStorage.getItem(LOGGED_MEALS_KEY);
      if (savedLogged) {
        const parsed = JSON.parse(savedLogged);
        if (parsed.date === today && Array.isArray(parsed.items)) {
          setLoggedMeals(parsed.items);
        }
      }
    } catch (e) {
      console.warn('Failed to load stored nutrition data:', e);
    }
  }, []);

  const setCurrentRecipe = (recipe) => {
    setCurrentRecipeState(recipe);
    try {
      if (recipe) {
        localStorage.setItem(RECIPE_KEY, JSON.stringify(recipe));
      } else {
        localStorage.removeItem(RECIPE_KEY);
      }
    } catch (e) {
      console.warn('LocalStorage save recipe error:', e);
    }
  };

  const saveRecipeToFavorites = (recipe) => {
    if (!recipe || !recipe.id) return;
    setSavedRecipes((prev) => {
      const exists = prev.some((r) => r.id === recipe.id);
      const updated = exists ? prev.filter((r) => r.id !== recipe.id) : [recipe, ...prev];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const isRecipeFavorite = (recipeId) => {
    return savedRecipes.some((r) => r.id === recipeId);
  };

  const saveMealPlan = (plan) => {
    setMealPlan(plan);
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    } catch (e) {}
  };

  const toggleMealComplete = (mealId, mealCalories = 0) => {
    const today = getTodayKey();
    setCompletedMeals((prev) => {
      const updated = prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : [...prev, mealId];
      try {
        localStorage.setItem(COMPLETED_MEALS_KEY, JSON.stringify({ date: today, meals: updated }));
      } catch (e) {}
      return updated;
    });
  };

  const logMealItem = (item) => {
    const today = getTodayKey();
    const entry = {
      id: `meal_${Date.now()}`,
      name: item.name || 'Logged Recipe / Meal',
      calories: parseInt(item.calories) || 0,
      protein: parseInt(item.protein) || 0,
      carbs: parseInt(item.carbs) || 0,
      fat: parseInt(item.fat) || 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLoggedMeals((prev) => {
      const updated = [...prev, entry];
      try {
        localStorage.setItem(LOGGED_MEALS_KEY, JSON.stringify({ date: today, items: updated }));
      } catch (e) {}
      return updated;
    });
  };

  const removeLoggedMeal = (id) => {
    const today = getTodayKey();
    setLoggedMeals((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem(LOGGED_MEALS_KEY, JSON.stringify({ date: today, items: updated }));
      } catch (e) {}
      return updated;
    });
  };

  const updateWaterHistory = (todayDate, newAmount) => {
    setWaterHistory((prev) => {
      const existing = prev.filter((h) => h.date !== todayDate);
      const updated = [...existing, { date: todayDate, amount: newAmount }].slice(-14);
      try {
        localStorage.setItem(WATER_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const addWater = (amount = 0.25) => {
    const newAmount = parseFloat((waterIntake + amount).toFixed(2));
    setWaterIntake(newAmount);
    const today = getTodayKey();
    try {
      localStorage.setItem(WATER_KEY, JSON.stringify({ date: today, amount: newAmount }));
    } catch (e) {}
    updateWaterHistory(today, newAmount);
    return newAmount;
  };

  const resetWater = () => {
    setWaterIntake(0);
    const today = getTodayKey();
    try {
      localStorage.removeItem(WATER_KEY);
    } catch (e) {}
    updateWaterHistory(today, 0);
  };

  // Compute total calories consumed today from completed meals & logged meals
  const getTodayCalories = () => {
    let total = 0;

    // From completed planned meals
    if (mealPlan?.meals) {
      mealPlan.meals.forEach((meal) => {
        if (completedMeals.includes(meal.id)) {
          total += meal.calories || 0;
        }
      });
    }

    // From individually logged meals or recipes
    loggedMeals.forEach((m) => {
      total += m.calories || 0;
    });

    return total;
  };

  return (
    <NutritionContext.Provider
      value={{
        currentRecipe,
        setCurrentRecipe,
        savedRecipes,
        saveRecipeToFavorites,
        isRecipeFavorite,
        mealPlan,
        completedMeals,
        loggedMeals,
        waterIntake,
        waterTarget,
        waterHistory,
        setWaterTarget,
        saveMealPlan,
        toggleMealComplete,
        logMealItem,
        removeLoggedMeal,
        addWater,
        resetWater,
        getTodayCalories,
        hasPlan: !!mealPlan,
        hasRecipe: !!currentRecipe,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export const useNutrition = () => {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition must be used within NutritionProvider');
  return ctx;
};
