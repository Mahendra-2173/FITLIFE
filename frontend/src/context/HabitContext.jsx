import { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext(null);
const HABITS_KEY = 'fitlife_habits';
const HABIT_LOGS_KEY = 'fitlife_habit_logs';

const DEFAULT_HABITS = [
  { id: 'h_water', title: 'Drink Daily Water Target', category: 'hydration', emoji: '💧' },
  { id: 'h_workout', title: 'Complete Daily Movement / Workout', category: 'fitness', emoji: '🏋️' },
  { id: 'h_sleep', title: '7+ Hours Restful Sleep', category: 'recovery', emoji: '😴' },
  { id: 'h_nutrition', title: 'Mindful Whole-Food Nutrition', category: 'nutrition', emoji: '🥗' },
];

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem(HABITS_KEY);
      const savedLogs = localStorage.getItem(HABIT_LOGS_KEY);

      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        setHabits(DEFAULT_HABITS);
        localStorage.setItem(HABITS_KEY, JSON.stringify(DEFAULT_HABITS));
      }

      if (savedLogs) {
        setHabitLogs(JSON.parse(savedLogs));
      }
    } catch (e) {
      console.warn('Failed to load habit data from storage:', e);
      setHabits(DEFAULT_HABITS);
    }
  }, []);

  const saveHabits = (newHabits) => {
    setHabits(newHabits);
    try {
      localStorage.setItem(HABITS_KEY, JSON.stringify(newHabits));
    } catch (e) {
      console.warn('LocalStorage save error (habits):', e);
    }
  };

  const saveLogs = (newLogs) => {
    setHabitLogs(newLogs);
    try {
      localStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(newLogs));
    } catch (e) {
      console.warn('LocalStorage save error (logs):', e);
    }
  };

  const addHabit = (habitData) => {
    if (!habitData.title || !habitData.title.trim()) return null;
    const titleTrimmed = habitData.title.trim();
    
    // Duplicate prevention
    const exists = habits.some(
      (h) => h.title.toLowerCase() === titleTrimmed.toLowerCase()
    );
    if (exists) {
      throw new Error('A habit with this name already exists.');
    }

    const newHabit = {
      id: `habit_${Date.now()}`,
      title: titleTrimmed,
      category: habitData.category || 'general',
      emoji: habitData.emoji || '⭐',
      createdAt: new Date().toISOString(),
    };

    const updated = [...habits, newHabit];
    saveHabits(updated);
    return newHabit;
  };

  const updateHabit = (id, updatedFields) => {
    const updated = habits.map((h) => (h.id === id ? { ...h, ...updatedFields } : h));
    saveHabits(updated);
  };

  const deleteHabit = (id) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabits(updated);

    // Clean up logs for deleted habit
    const newLogs = { ...habitLogs };
    Object.keys(newLogs).forEach((dateKey) => {
      if (newLogs[dateKey] && newLogs[dateKey][id] !== undefined) {
        const dateLog = { ...newLogs[dateKey] };
        delete dateLog[id];
        newLogs[dateKey] = dateLog;
      }
    });
    saveLogs(newLogs);
  };

  const toggleHabit = (id, date = getTodayKey()) => {
    const dateLog = habitLogs[date] || {};
    const isCompleted = !!dateLog[id];

    const updatedDateLog = {
      ...dateLog,
      [id]: !isCompleted,
    };

    const updatedLogs = {
      ...habitLogs,
      [date]: updatedDateLog,
    };

    saveLogs(updatedLogs);
  };

  const isHabitCompleted = (id, date = getTodayKey()) => {
    return !!(habitLogs[date] && habitLogs[date][id]);
  };

  const getTodayStats = () => {
    const today = getTodayKey();
    const todayLog = habitLogs[today] || {};
    const total = habits.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };

    const completed = habits.filter((h) => !!todayLog[h.id]).length;
    const percent = Math.round((completed / total) * 100);

    return { total, completed, percent };
  };

  const getHabitHistory = (numDays = 7) => {
    const result = [];
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en-US', { weekday: 'short' });

      const dateLog = habitLogs[dateKey] || {};
      const total = habits.length;
      const completed = habits.filter((h) => !!dateLog[h.id]).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      result.push({
        date: label,
        fullDate: dateKey,
        percent,
        completed,
        total,
      });
    }

    return result;
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        habitLogs,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        isHabitCompleted,
        getTodayStats,
        getHabitHistory,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export const useHabit = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabit must be used within HabitProvider');
  return ctx;
};
