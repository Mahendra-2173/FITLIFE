import { createContext, useContext, useState, useEffect } from 'react';

const WorkoutContext = createContext(null);
const PLAN_KEY = 'fitlife_workout_plan';
const SESSIONS_KEY = 'fitlife_sessions';

export function WorkoutProvider({ children }) {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLAN_KEY);
      const savedSessions = localStorage.getItem(SESSIONS_KEY);
      if (saved) setWorkoutPlan(JSON.parse(saved));
      if (savedSessions) setSessions(JSON.parse(savedSessions));
    } catch (e) {
      console.error('Failed to load workout data', e);
    }
  }, []);

  const savePlan = (plan) => {
    setWorkoutPlan(plan);
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    } catch (e) {}
  };

  const saveSession = (session) => {
    const updated = [...sessions, { ...session, id: session.id || Date.now().toString(), date: session.date || new Date().toISOString() }];
    setSessions(updated);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated.slice(-100)));
    } catch (e) {}
  };

  const deleteSession = (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const clearSessions = () => {
    setSessions([]);
    try {
      localStorage.removeItem(SESSIONS_KEY);
    } catch (e) {}
  };

  const getTodayWorkout = () => {
    if (!workoutPlan?.weeklyPlan) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return workoutPlan.weeklyPlan.find(d => d.day === today) || workoutPlan.weeklyPlan[0];
  };

  const getWorkoutByDay = (dayName) => {
    if (!workoutPlan?.weeklyPlan) return null;
    return workoutPlan.weeklyPlan.find(d => d.day.toLowerCase() === dayName.toLowerCase());
  };

  // Compute real weekly workout stats for dashboard & progress analytics
  const getWeeklyWorkoutStats = () => {
    const plannedDays = workoutPlan?.weeklyPlan?.filter(d => !d.isRestDay)?.length || 4;
    
    // Filter sessions completed within the last 7 days
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(s => {
      if (!s.date) return false;
      const sDate = new Date(s.date);
      return sDate >= oneWeekAgo && sDate <= now;
    });

    const completedThisWeek = recentSessions.length;
    const totalMinutesThisWeek = recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const adherencePct = plannedDays > 0 ? Math.min(100, Math.round((completedThisWeek / plannedDays) * 100)) : 0;

    return {
      completedThisWeek,
      plannedDays,
      totalMinutesThisWeek,
      adherencePct,
      recentSessions,
    };
  };

  return (
    <WorkoutContext.Provider value={{
      workoutPlan,
      sessions,
      completedSessions: sessions, // Alias for backward compatibility
      currentSession,
      setCurrentSession,
      savePlan,
      saveSession,
      completeSession: saveSession, // Alias for WorkoutSession.jsx
      deleteSession,
      clearSessions,
      getTodayWorkout,
      getWorkoutByDay,
      getWeeklyWorkoutStats,
      hasPlan: !!workoutPlan,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
};
