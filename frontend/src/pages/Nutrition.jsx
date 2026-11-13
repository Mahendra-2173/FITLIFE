import { useState, useRef, useEffect } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { useUser } from '../context/UserContext';
import { recipeApi, nutritionApi } from '../api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import {
  UtensilsCrossed, Sparkles, Check, RefreshCw, Clock, Users,
  AlertTriangle, ChevronRight, Bookmark, BookmarkCheck,
  Flame, Plus, X, RotateCcw, Play, Pause, Info, ChefHat,
  ArrowRight, ShieldCheck, Scale, Lightbulb
} from 'lucide-react';

const COMMON_STAPLES = [
  'Chicken breast', 'Eggs', 'Fresh spinach', 'Greek yogurt',
  'Rolled oats', 'Brown rice', 'Garlic cloves', 'Olive oil',
  'Cherry tomatoes', 'Canned chickpeas', 'Broccoli', 'Cheddar cheese'
];

const DIETARY_OPTIONS = [
  { value: 'any', label: 'Any / Balanced', emoji: '🍽️' },
  { value: 'high_protein', label: 'High Protein', emoji: '💪' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'non_vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Keto / Low-Carb', emoji: '🥑' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
];

export default function Nutrition() {
  const { profile, bodyAnalysis } = useUser();
  const {
    currentRecipe,
    setCurrentRecipe,
    saveRecipeToFavorites,
    isRecipeFavorite,
    mealPlan,
    saveMealPlan,
    completedMeals,
    toggleMealComplete,
  } = useNutrition();

  // Active view tab: 'fridge' (Primary assignment feature) or 'schedule' (Supporting feature)
  const [activeTab, setActiveTab] = useState('fridge');

  // Fridge-to-Recipe Form State
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [ingredientTags, setIngredientTags] = useState(['Chicken breast', 'Fresh spinach', 'Garlic cloves', 'Olive oil']);
  const [avoidInput, setAvoidInput] = useState('');
  const [avoidTags, setAvoidTags] = useState([]);
  const [dietaryPref, setDietaryPref] = useState('high_protein');
  const [targetServings, setTargetServings] = useState(2);
  const [maxCookingTime, setMaxCookingTime] = useState(30);
  const [allergies, setAllergies] = useState('');

  // Interactive Recipe View State
  const [servingScale, setServingScale] = useState(2);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedSteps, setCheckedSteps] = useState({});
  const [activeTimerStep, setActiveTimerStep] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Refinement Loop State
  const [refinementPrompt, setRefinementPrompt] = useState('');

  // AI Request & State Management
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const activeAbortController = useRef(null);
  const activeRequestId = useRef(0);

  // Sync serving scale when a new recipe is loaded
  useEffect(() => {
    if (currentRecipe?.servings) {
      setServingScale(currentRecipe.servings);
    }
  }, [currentRecipe?.id]);

  // Step countdown timer effect
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timerRemaining === 0 && timerRunning) {
      setTimerRunning(false);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  // Add ingredient tag
  const addIngredientTag = (name) => {
    const trimmed = name.trim();
    if (trimmed && !ingredientTags.includes(trimmed)) {
      setIngredientTags([...ingredientTags, trimmed]);
      setIngredientsInput('');
    }
  };

  const removeIngredientTag = (name) => {
    setIngredientTags(ingredientTags.filter((t) => t !== name));
  };

  const addAvoidTag = (name) => {
    const trimmed = name.trim();
    if (trimmed && !avoidTags.includes(trimmed)) {
      setAvoidTags([...avoidTags, trimmed]);
      setAvoidInput('');
    }
  };

  const removeAvoidTag = (name) => {
    setAvoidTags(avoidTags.filter((t) => t !== name));
  };

  const loadSamplePantry = () => {
    setIngredientTags(['Chicken breast', 'Fresh spinach', 'Garlic cloves', 'Olive oil', 'Cherry tomatoes']);
    setAvoidTags([]);
    setDietaryPref('high_protein');
    setTargetServings(2);
    setMaxCookingTime(25);
  };

  // ─────────────────────────────────────────────────────────────────
  // Primary AI Recipe Generation Call
  // ─────────────────────────────────────────────────────────────────
  const handleGenerateRecipe = async () => {
    if (ingredientTags.length === 0 && !ingredientsInput.trim()) {
      setError('Please provide at least one available fridge ingredient.');
      return;
    }

    const currentIngredients = ingredientsInput.trim()
      ? [...ingredientTags, ingredientsInput.trim()]
      : ingredientTags;

    // Cancel existing in-flight request if present
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const controller = new AbortController();
    activeAbortController.current = controller;

    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    setLoadingMessage('Scanning your fridge ingredients & consulting AI culinary engine...');

    try {
      const response = await recipeApi.generate(
        {
          availableIngredients: currentIngredients,
          avoidIngredients: avoidTags,
          dietaryPreference: dietaryPref,
          servings: targetServings,
          maxCookingTime: maxCookingTime,
          allergies: allergies.trim(),
        },
        controller.signal
      );

      // Verify this is still the freshest request (anti-race condition)
      if (activeRequestId.current !== requestId) return;

      if (response.success && response.data) {
        setCurrentRecipe(response.data);
        setServingScale(response.data.servings || targetServings);
        setCheckedIngredients({});
        setCheckedSteps({});
        setRefinementPrompt('');
      } else {
        throw new Error(response.error || 'Failed to generate a valid recipe structure.');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('cancelled')) {
        return; // Request was cleanly cancelled by user
      }
      if (activeRequestId.current === requestId) {
        setError(err.message || 'Unable to generate recipe. Please verify your connection and try again.');
      }
    } finally {
      if (activeRequestId.current === requestId) {
        setLoading(false);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Follow-up AI Refinement Loop (Assignment Stretch Goal)
  // ─────────────────────────────────────────────────────────────────
  const handleRefineRecipe = async () => {
    if (!currentRecipe || !refinementPrompt.trim()) return;

    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    const controller = new AbortController();
    activeAbortController.current = controller;

    const reqId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    setLoadingMessage(`Refining "${currentRecipe.name}" based on your instructions...`);

    try {
      const response = await recipeApi.refine(
        {
          recipe: currentRecipe,
          refinementPrompt: refinementPrompt.trim(),
        },
        controller.signal
      );

      if (activeRequestId.current !== reqId) return;

      if (response.success && response.data) {
        setCurrentRecipe(response.data);
        setServingScale(response.data.servings || servingScale);
        setCheckedSteps({});
        setRefinementPrompt('');
      } else {
        throw new Error(response.error || 'Failed to refine recipe.');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('cancelled')) return;
      if (activeRequestId.current === reqId) {
        setError(err.message || 'Failed to refine recipe.');
      }
    } finally {
      if (activeRequestId.current === reqId) {
        setLoading(false);
      }
    }
  };

  // Helper for dynamic ingredient scaling
  const scaleQuantity = (baseQty, baseServings) => {
    if (!baseQty) return 0;
    const ref = baseServings || currentRecipe?.servings || 1;
    const ratio = servingScale / ref;
    const scaled = baseQty * ratio;
    // Format cleanly: round to 2 decimals or 1 decimal if non-integer
    return scaled % 1 === 0 ? scaled : parseFloat(scaled.toFixed(1));
  };

  const scaleNutrient = (val) => {
    if (!val) return 0;
    // Per serving remains constant; total would scale, but nutrition is labeled "per serving"
    return Math.round(val);
  };

  const toggleIngredientCheck = (id) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStepCheck = (num) => {
    setCheckedSteps((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const startStepTimer = (minutes, stepNum) => {
    setActiveTimerStep(stepNum);
    setTimerRemaining(minutes * 60);
    setTimerRunning(true);
  };

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Steps completion calculation
  const totalSteps = currentRecipe?.instructions?.length || 0;
  const completedStepsCount = Object.values(checkedSteps).filter(Boolean).length;
  const stepsPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Top Header & Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="badge badge-green" style={{ marginBottom: '0.4rem' }}>
            <UtensilsCrossed size={12} /> Primary Internship Feature
          </div>
          <h1 className="page-title">Fridge-to-Recipe AI Generator</h1>
          <p className="page-subtitle">
            Turn whatever is in your refrigerator into a delicious, chef-crafted, macro-balanced recipe with interactive cooking steps.
          </p>
        </div>

        {/* Tab Toggle: Fridge to Recipe (Primary) vs Daily Meal Plan */}
        <div style={{
          display: 'flex', background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.25rem'
        }}>
          <button
            className={`btn btn-sm ${activeTab === 'fridge' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('fridge')}
          >
            <ChefHat size={14} /> Fridge-to-Recipe
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'schedule' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Scale size={14} /> Daily Meal Plan
          </button>
        </div>
      </div>

      {activeTab === 'fridge' ? (
        <>
          {/* ───────────────────────────────────────────────────────── */}
          {/* 1. FRIDGE INGREDIENTS INPUT FORM CARD                     */}
          {/* ───────────────────────────────────────────────────────── */}
          <section className="card" style={{ marginBottom: '1.75rem', borderColor: 'var(--border-light)' }} aria-label="Fridge Inputs">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChefHat size={20} color="var(--accent-green)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  What's in your refrigerator today?
                </h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={loadSamplePantry}
                title="Fill with standard ingredients for quick testing"
              >
                <Sparkles size={13} color="var(--accent-green)" /> Autofill Sample Fridge
              </button>
            </div>

            {/* Ingredient Tags Display */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Available Ingredients ({ingredientTags.length} selected):
              </label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                minHeight: 46, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-color)'
              }}>
                {ingredientTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: 'var(--accent-green-light)', color: 'var(--accent-green)',
                      border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeIngredientTag(tag)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <input
                  className="form-input"
                  style={{
                    flex: 1, minWidth: 180, border: 'none', background: 'transparent',
                    padding: '0.2rem 0.5rem', outline: 'none', boxShadow: 'none'
                  }}
                  placeholder={ingredientTags.length === 0 ? "Type an ingredient and press Enter (e.g. Chicken, Eggs, Spinach)..." : "Add more ingredients..."}
                  value={ingredientsInput}
                  onChange={(e) => setIngredientsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredientTag(ingredientsInput);
                    }
                  }}
                />
              </div>

              {/* Quick-add chips */}
              <div style={{ marginTop: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                  Quick add staples:
                </span>
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {COMMON_STAPLES.filter((s) => !ingredientTags.includes(s)).slice(0, 7).map((staple) => (
                    <button
                      key={staple}
                      type="button"
                      onClick={() => addIngredientTag(staple)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)', padding: '0.15rem 0.55rem',
                        fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                      }}
                    >
                      <Plus size={10} /> {staple}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ingredients to Avoid / Exclusions */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                Ingredients to Avoid / Exclude (Optional):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                {avoidTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      background: 'var(--accent-red-light)', color: 'var(--accent-red)',
                      border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-full)',
                      padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600
                    }}
                  >
                    🚫 {tag}
                    <button
                      onClick={() => removeAvoidTag(tag)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                      aria-label={`Remove avoid ${tag}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  className="form-input form-input-sm"
                  style={{ width: 240 }}
                  placeholder="e.g. Cilantro, Pork, Dairy..."
                  value={avoidInput}
                  onChange={(e) => setAvoidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAvoidTag(avoidInput);
                    }
                  }}
                />
              </div>
            </div>

            {/* Dietary Preference & Controls Grid */}
            <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Dietary Preference</label>
                <select
                  className="form-input form-select"
                  value={dietaryPref}
                  onChange={(e) => setDietaryPref(e.target.value)}
                >
                  {DIETARY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Servings ({targetServings})</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[1, 2, 4, 6].map((srv) => (
                    <button
                      key={srv}
                      type="button"
                      className={`btn btn-sm ${targetServings === srv ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setTargetServings(srv)}
                    >
                      {srv} {srv === 1 ? 'serving' : 'servings'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max Cooking Time ({maxCookingTime} mins)</label>
                <select
                  className="form-input form-select"
                  value={maxCookingTime}
                  onChange={(e) => setMaxCookingTime(parseInt(e.target.value))}
                >
                  <option value={15}>⚡ 15 mins (Speed Skillet)</option>
                  <option value={25}>⏱️ 25 mins (Quick Dinner)</option>
                  <option value={35}>🍲 35 mins (Standard Meal)</option>
                  <option value={50}>🥘 50 mins (Full Prep & Bake)</option>
                </select>
              </div>
            </div>

            {/* Allergies / Notes */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Allergies / Special Instructions (Optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Nut allergy, lactose sensitive, prefer cast-iron or air fryer..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            {/* Generate CTA Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerateRecipe}
                disabled={loading}
                style={{ minWidth: 220 }}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" /> Crafting Recipe...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate AI Recipe
                  </>
                )}
              </button>
            </div>
          </section>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 2. LOADING, ERROR, & EMPTY STATES                         */}
          {/* ───────────────────────────────────────────────────────── */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', marginBottom: '1.5rem' }}>
              <LoadingSpinner text={loadingMessage || "Generating your personalized structured recipe..."} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1rem' }}>
                Querying Groq LLaMA 3.3 · Validating ingredient units & execution steps with Zod schemas
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ marginBottom: '1.5rem' }}>
              <ErrorState
                title="Recipe Generation Encountered an Error"
                message={error}
                onRetry={handleGenerateRecipe}
              />
            </div>
          )}

          {!currentRecipe && !loading && !error && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--accent-green-light)', border: '1px solid var(--accent-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
              }}>
                <UtensilsCrossed size={30} color="var(--accent-green)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Your Recipe Lab is Ready
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
                Add the ingredients you currently have in your kitchen above and click <strong>Generate AI Recipe</strong> to produce an interactive step-by-step culinary protocol.
              </p>
              <button className="btn btn-secondary" onClick={loadSamplePantry}>
                <Sparkles size={15} /> Try with Sample Fridge Staples
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3. STRUCTURED INTERACTIVE RECIPE DISPLAY                  */}
          {/* ───────────────────────────────────────────────────────── */}
          {currentRecipe && !loading && (
            <article className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Fallback Notice Banner (If AI failed and pre-validated template was used) */}
              {currentRecipe.isFallback && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius)', padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--accent-orange)'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Verified Offline Recipe Loaded:</strong> The remote AI model was temporarily unavailable ({currentRecipe.fallbackReason || 'API response delay'}). A pre-validated, high-protein recipe matching your criteria was loaded so you never experience downtime. You can retry the AI generation anytime.
                  </div>
                </div>
              )}

              {/* Recipe Hero Card */}
              <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span className="badge badge-green">
                        {currentRecipe.cuisine || 'Modern'} Cuisine
                      </span>
                      <span className="badge badge-blue">
                        {currentRecipe.dietaryCategory || 'Balanced'}
                      </span>
                      <span className="badge badge-neutral">
                        {currentRecipe.difficulty || 'Easy'}
                      </span>
                      {currentRecipe.isAIGenerated && (
                        <span className="badge badge-purple">
                          <Sparkles size={11} /> AI Structured Output
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                      {currentRecipe.name}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', maxWidth: 760 }}>
                      {currentRecipe.description}
                    </p>
                  </div>

                  {/* Actions: Favorite / Regenerate */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn btn-sm ${isRecipeFavorite(currentRecipe.id) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => saveRecipeToFavorites(currentRecipe)}
                      title="Save to favorites"
                    >
                      {isRecipeFavorite(currentRecipe.id) ? (
                        <>
                          <BookmarkCheck size={14} /> Saved
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} /> Save Recipe
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleGenerateRecipe}
                      title="Regenerate another recipe with these ingredients"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </button>
                  </div>
                </div>

                {/* Timing & Servings Highlights */}
                <div className="grid-3" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={20} color="var(--accent-blue)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL COOK TIME</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                        {currentRecipe.totalTimeMinutes} mins
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        Prep: {currentRecipe.prepTimeMinutes}m · Cook: {currentRecipe.cookTimeMinutes}m
                      </div>
                    </div>
                  </div>

                  {/* Interactive Dynamic Servings Scaler */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="var(--accent-green)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SERVINGS SCALE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
                        {[1, 2, 4, 6].map((srv) => (
                          <button
                            key={srv}
                            onClick={() => setServingScale(srv)}
                            style={{
                              padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                              background: servingScale === srv ? 'var(--accent-green)' : 'rgba(255,255,255,0.06)',
                              color: servingScale === srv ? '#042f1a' : 'var(--text-secondary)',
                              border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            {srv}x
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Auto-scales ingredient measurements
                      </div>
                    </div>
                  </div>

                  {/* Estimated Calories Per Serving */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame size={20} color="var(--accent-orange)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EST. CALORIES / SERVING</div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-orange)', fontSize: '1.05rem' }}>
                        {scaleNutrient(currentRecipe.estimatedNutrition?.caloriesPerServing)} kcal
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        {scaleNutrient(currentRecipe.estimatedNutrition?.proteinGrams)}g Protein · {scaleNutrient(currentRecipe.estimatedNutrition?.carbsGrams)}g Carbs
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Scalable Ingredients & Step Instructions */}
              <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                {/* ─── Column A: Scalable Ingredients & Substitutions ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Ingredients ({servingScale} {servingScale === 1 ? 'serving' : 'servings'})
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Check off as prepped
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentRecipe.ingredients?.map((ing) => {
                        const isDone = checkedIngredients[ing.id];
                        const displayQty = scaleQuantity(ing.quantity, currentRecipe.servings);

                        return (
                          <div
                            key={ing.id}
                            onClick={() => toggleIngredientCheck(ing.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.65rem 0.85rem', borderRadius: 8, cursor: 'pointer',
                              background: isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: 5,
                                border: `1.5px solid ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                                background: isDone ? 'var(--accent-green)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {isDone && <Check size={13} color="#042f1a" strokeWidth={3} />}
                              </div>
                              <span style={{
                                fontSize: '0.85rem',
                                color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: isDone ? 'line-through' : 'none',
                                fontWeight: 500
                              }}>
                                {ing.name}
                                {ing.notes && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>({ing.notes})</span>}
                              </span>
                            </div>

                            <span style={{
                              fontWeight: 700, fontSize: '0.85rem',
                              color: isDone ? 'var(--text-muted)' : 'var(--accent-green)',
                              flexShrink: 0
                            }}>
                              {displayQty} {ing.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ingredient Substitutions Panel (PDF Requirement!) */}
                  {currentRecipe.substitutions && currentRecipe.substitutions.length > 0 && (
                    <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <RefreshCw size={17} color="var(--accent-blue)" />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Smart Ingredient Substitutions
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {currentRecipe.substitutions.map((sub, sIdx) => (
                          <div key={sIdx} style={{
                            background: 'rgba(56, 189, 248, 0.05)', borderRadius: 8, padding: '0.6rem 0.75rem',
                            border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '0.8rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <span style={{ color: 'var(--accent-red)' }}>{sub.originalIngredient}</span>
                              <ArrowRight size={12} color="var(--text-muted)" />
                              <span style={{ color: 'var(--accent-blue)' }}>{sub.substituteIngredient}</span>
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              {sub.reasonOrRatio}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutrition Breakdown & Medical Disclaimer */}
                  <div className="card">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      Estimated Nutrition (Per Serving)
                    </h3>
                    <div className="grid-2" style={{ gap: '0.6rem', marginBottom: '0.875rem' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.75rem', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROTEIN</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                          {scaleNutrient(currentRecipe.estimatedNutrition?.proteinGrams)}g
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.75rem', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NET CARBS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                          {scaleNutrient(currentRecipe.estimatedNutrition?.carbsGrams)}g
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.75rem', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HEALTHY FATS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-orange)' }}>
                          {scaleNutrient(currentRecipe.estimatedNutrition?.fatGrams)}g
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.75rem', borderRadius: 8 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DIETARY FIBER</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                          {scaleNutrient(currentRecipe.estimatedNutrition?.fiberGrams)}g
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex', gap: '0.45rem', padding: '0.5rem 0.65rem', borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.02)', fontSize: '0.7rem', color: 'var(--text-muted)'
                    }}>
                      <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{currentRecipe.estimatedNutrition?.disclaimer || 'Estimated values calculated by AI nutrition engine; not for medical use.'}</span>
                    </div>
                  </div>
                </div>

                {/* ─── Column B: Step-by-Step Cooking Guide ─── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Cooking Instructions
                      </h3>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: stepsPercentage === 100 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {completedStepsCount}/{totalSteps} ({stepsPercentage}%)
                      </span>
                    </div>

                    {/* Steps Progress bar */}
                    <div className="progress-bar" style={{ height: 6, marginBottom: '1.25rem' }}>
                      <div className="progress-fill" style={{ width: `${stepsPercentage}%`, background: 'var(--accent-green)' }} />
                    </div>

                    {/* Step Cards with Checkboxes & Embedded Timers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {currentRecipe.instructions?.map((step) => {
                        const isDone = checkedSteps[step.stepNumber];
                        const isTimerActive = activeTimerStep === step.stepNumber;

                        return (
                          <div
                            key={step.stepNumber}
                            style={{
                              padding: '1rem', borderRadius: 10,
                              background: isDone ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                              border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                              <button
                                onClick={() => toggleStepCheck(step.stepNumber)}
                                style={{
                                  width: 24, height: 24, borderRadius: 6,
                                  border: `1.5px solid ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                                  background: isDone ? 'var(--accent-green)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', marginTop: 2, flexShrink: 0
                                }}
                                aria-label={`Mark step ${step.stepNumber} done`}
                              >
                                {isDone && <Check size={14} color="#042f1a" strokeWidth={3} />}
                              </button>

                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.2rem' }}>
                                  Step {step.stepNumber}
                                </div>
                                <p style={{
                                  fontSize: '0.88rem',
                                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  lineHeight: 1.55
                                }}>
                                  {step.instruction}
                                </p>

                                {step.tip && (
                                  <div style={{
                                    marginTop: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: 6,
                                    background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.75rem',
                                    color: 'var(--text-secondary)'
                                  }}>
                                    💡 <strong>Chef Cue:</strong> {step.tip}
                                  </div>
                                )}

                                {/* Interactive Embedded Step Timer (PDF Interactive Tool Requirement) */}
                                {step.timerMinutes && step.timerMinutes > 0 ? (
                                  <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    {isTimerActive ? (
                                      <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                        background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)',
                                        borderRadius: 6, padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 700,
                                        color: 'var(--accent-green)'
                                      }}>
                                        <Clock size={14} />
                                        <span>{formatTimer(timerRemaining)}</span>
                                        <button
                                          onClick={() => setTimerRunning(!timerRunning)}
                                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                                        >
                                          {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ fontSize: '0.72rem', height: 28 }}
                                        onClick={() => startStepTimer(step.timerMinutes, step.stepNumber)}
                                      >
                                        <Play size={11} /> Start {step.timerMinutes}-min step timer
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chef's Cooking Tips */}
                  {currentRecipe.cookingTips && currentRecipe.cookingTips.length > 0 && (
                    <div className="card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <Lightbulb size={18} color="var(--accent-orange)" />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Chef's Culinary Notes
                        </h3>
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                        {currentRecipe.cookingTips.map((tip, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '0.3rem' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Refinement Loop Box (Assignment Stretch Goal) */}
                  <div className="card" style={{ border: '1px dashed var(--border-light)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      Refine this recipe with AI
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Ask for modifications without starting over (e.g. <em>"Make it spicy with crushed red pepper"</em> or <em>"Convert this to an oven-baked casserole"</em>).
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="form-input"
                        placeholder="Type recipe adjustment request..."
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRefineRecipe()}
                      />
                      <button
                        className="btn btn-secondary"
                        onClick={handleRefineRecipe}
                        disabled={loading || !refinementPrompt.trim()}
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}
        </>
      ) : (
        /* ───────────────────────────────────────────────────────── */
        /* SECONDARY TAB: SUPPORTING DAILY MEAL PLAN                 */
        /* ───────────────────────────────────────────────────────── */
        <section className="card animate-fade-in" aria-label="Daily Nutrition Schedule">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Personalized Daily Meal Timetable
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Balanced 5-meal schedule calculated to meet your calorie and macronutrient targets.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await nutritionApi.generateMealPlan(profile || {}, '');
                  if (res.success && res.data) saveMealPlan(res.data);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Generate Full Day Plan
            </button>
          </div>

          {!mealPlan ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No daily meal plan generated yet. Click above to compute your daily timetable.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {mealPlan.meals?.map((meal) => {
                const isDone = completedMeals.includes(meal.id);
                return (
                  <div
                    key={meal.id}
                    style={{
                      padding: '1rem', borderRadius: 10,
                      background: isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isDone ? 'var(--accent-green)' : 'var(--border-color)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={() => toggleMealComplete(meal.id)}
                          style={{
                            width: 24, height: 24, borderRadius: 6,
                            border: `1.5px solid ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                            background: isDone ? 'var(--accent-green)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {isDone && <Check size={14} color="#042f1a" strokeWidth={3} />}
                        </button>
                        <span style={{ fontSize: '1.4rem' }}>{meal.emoji || '🍽️'}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {meal.name} <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{meal.time}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {meal.totalCalories} kcal · {meal.totalProtein}g P · {meal.totalCarbs}g C · {meal.totalFat}g F
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
