import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY = 'fitlife_profile';
const ANALYSIS_KEY = 'fitlife_body_analysis';
const WEIGHT_LOGS_KEY = 'fitlife_weight_history';
const MEASUREMENTS_KEY = 'fitlife_measurements';

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [measurements, setMeasurements] = useState({ waist: null, chest: null, hips: null });
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedAnalysis = localStorage.getItem(ANALYSIS_KEY);
      const savedWeights = localStorage.getItem(WEIGHT_LOGS_KEY);
      const savedMeasurements = localStorage.getItem(MEASUREMENTS_KEY);

      let parsedProfile = null;
      if (saved) {
        parsedProfile = JSON.parse(saved);
        setProfile(parsedProfile);
      }
      if (savedAnalysis) setBodyAnalysis(JSON.parse(savedAnalysis));

      if (savedWeights) {
        setWeightLogs(JSON.parse(savedWeights));
      } else if (parsedProfile?.weight) {
        const initial = [{
          date: 'Initial',
          weight: parseFloat(parsedProfile.weight),
          id: 'w_init',
          timestamp: new Date().toISOString(),
        }];
        setWeightLogs(initial);
        localStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(initial));
      }

      if (savedMeasurements) {
        setMeasurements(JSON.parse(savedMeasurements));
      }
    } catch (e) {
      console.error('Failed to load profile from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = (data) => {
    const updated = { ...data, updatedAt: new Date().toISOString() };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Auto-sync current weight into weight logs if changed
    if (data.weight) {
      const w = parseFloat(data.weight);
      if (!isNaN(w) && w > 0) {
        setWeightLogs((prev) => {
          const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const exists = prev.find((l) => l.date === today);
          let newLogs;
          if (exists) {
            newLogs = prev.map((l) => (l.date === today ? { ...l, weight: w } : l));
          } else {
            newLogs = [...prev, { date: today, weight: w, id: `w_${Date.now()}`, timestamp: new Date().toISOString() }];
          }
          try {
            localStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(newLogs));
          } catch (e) {}
          return newLogs;
        });
      }
    }
  };

  const addWeightLog = (weight, customDate) => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 20 || w >= 350) {
      throw new Error('Please enter a realistic weight value between 20 kg and 350 kg.');
    }

    const dateStr = customDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newEntry = {
      id: `w_${Date.now()}`,
      date: dateStr,
      weight: w,
      timestamp: new Date().toISOString(),
    };

    const updated = [...weightLogs, newEntry];
    setWeightLogs(updated);
    try {
      localStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Also update current profile weight
    if (profile) {
      saveProfile({ ...profile, weight: w });
    }

    return newEntry;
  };

  const deleteWeightLog = (id) => {
    const updated = weightLogs.filter((l) => l.id !== id);
    setWeightLogs(updated);
    try {
      localStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const saveMeasurements = (newMeasurements) => {
    const updated = { ...measurements, ...newMeasurements };
    setMeasurements(updated);
    try {
      localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const saveBodyAnalysis = (data) => {
    setBodyAnalysis(data);
    try {
      localStorage.setItem(ANALYSIS_KEY, JSON.stringify(data));
    } catch (e) {}
  };

  const clearProfile = () => {
    setProfile(null);
    setBodyAnalysis(null);
    setWeightLogs([]);
    setMeasurements({ waist: null, chest: null, hips: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANALYSIS_KEY);
      localStorage.removeItem(WEIGHT_LOGS_KEY);
      localStorage.removeItem(MEASUREMENTS_KEY);
    } catch (e) {}
  };

  const logout = () => {
    clearProfile();
    try {
      localStorage.removeItem('fitlife_current_recipe');
      localStorage.removeItem('fitlife_workout_plan');
      localStorage.removeItem('fitlife_sessions');
      localStorage.removeItem('fitlife_schedule');
      localStorage.removeItem('fitlife_habits');
      localStorage.removeItem('fitlife_habit_logs');
      localStorage.removeItem('fitlife_water_today');
      localStorage.removeItem('fitlife_water_history');
      localStorage.removeItem('fitlife_sleep_logs');
      localStorage.removeItem('fitlife_steps');
    } catch (e) {}
  };

  const hasProfile = !!profile;

  return (
    <UserContext.Provider value={{
      profile,
      bodyAnalysis,
      weightLogs,
      measurements,
      isLoading,
      hasProfile,
      saveProfile,
      addWeightLog,
      deleteWeightLog,
      saveMeasurements,
      saveBodyAnalysis,
      clearProfile,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
