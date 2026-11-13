import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new Error('Request cancelled by user'));
    }
    if (error.response) {
      const msg = error.response.data?.error || error.response.data?.message || 'Server error occurred';
      const details = error.response.data?.details;
      const fullMsg = details && Array.isArray(details) ? `${msg}: ${details.join(', ')}` : msg;
      return Promise.reject(new Error(fullMsg));
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. The AI engine is taking longer than usual. Please retry.'));
    }
    return Promise.reject(new Error('Network error. Check your connection or verify backend is running on port 5000.'));
  }
);

export const recipeApi = {
  generate: (payload, signal) => api.post('/nutrition/recipe/generate', payload, { signal }),
  refine: (payload, signal) => api.post('/nutrition/recipe/refine', payload, { signal }),
  getLast: () => api.get('/nutrition/recipe/last'),
  getFavorites: () => api.get('/nutrition/recipe/favorites'),
  saveFavorite: (recipe) => api.post('/nutrition/recipe/favorites', recipe),
};

export const profileApi = {
  save: (data) => api.post('/profile', data),
  get: () => api.get('/profile'),
};

export const bodyAnalysisApi = {
  calculate: (data) => api.post('/body-analysis', data),
};

export const workoutApi = {
  generate: (payload, customPrompt, signal) => {
    const body = customPrompt || payload?.profile
      ? (payload.profile ? payload : { profile: payload, customPrompt })
      : { profile: payload };
    return api.post('/workout/generate', body, { signal });
  },
  getPlan: () => api.get('/workout/plan'),
  refineExercise: (data) => api.post('/workout/refine', data),
  saveSession: (data) => api.post('/workout/session', data),
  getHistory: () => api.get('/workout/history'),
};

export const nutritionApi = {
  generateMealPlan: (payload, ingredientsList, signal) => {
    const body = ingredientsList || payload?.profile
      ? (payload.profile ? payload : { profile: payload, ingredientsList })
      : { profile: payload };
    return api.post('/nutrition/mealplan/generate', body, { signal });
  },
  getPlan: () => api.get('/nutrition/plan'),
};

export const scheduleApi = {
  generate: (data, signal) => api.post('/schedule/generate', data, { signal }),
  getToday: () => api.get('/schedule/today'),
};

export const coachApi = {
  ask: (data, signal) => api.post('/coach', data, { signal }),
};

export const progressApi = {
  getAll: () => api.get('/progress'),
  addEntry: (data) => api.post('/progress', data),
  logWater: (data) => api.post('/progress/water', data),
  getTodayWater: () => api.get('/progress/water/today'),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
