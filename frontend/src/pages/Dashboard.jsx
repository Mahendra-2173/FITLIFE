import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useWorkout } from '../context/WorkoutContext';
import { useNutrition } from '../context/NutritionContext';
import { useHabit } from '../context/HabitContext';
import StatCard from '../components/StatCard';
import {
  UtensilsCrossed, Dumbbell, Droplets, TrendingUp, Sparkles, Scale,
  Flame, Calendar, ChevronRight, Clock, Award, ArrowRight, CheckCircle2,
  Check, Play
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, bodyAnalysis } = useUser();
  const { workoutPlan, getTodayWorkout, getWeeklyWorkoutStats, sessions } = useWorkout();
  const { waterIntake, waterTarget, getTodayCalories, currentRecipe } = useNutrition();
  const { getTodayStats } = useHabit();
  const [greeting, setGreeting] = useState('');

  const today = new Date();
  const todayWorkout = getTodayWorkout();
  const weeklyStats = getWeeklyWorkoutStats();
  const habitStats = getTodayStats();

  // Real calories calculation
  const consumedCalories = getTodayCalories();
  const targetCalories = bodyAnalysis?.calorieTarget || 2000;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);

  // Check if today's workout was already logged
  const todayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  const isTodayWorkoutLogged = sessions.some(s => {
    if (!s.date) return false;
    const sDate = new Date(s.date).toISOString().split('T')[0];
    const todayDateKey = today.toISOString().split('T')[0];
    return sDate === todayDateKey || (s.day && s.day.toLowerCase() === todayStr.toLowerCase());
  });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const waterPct = Math.min(100, Math.round((waterIntake / waterTarget) * 100));

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ─── 1. Welcome Hero Section ───────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(18, 18, 24, 0.98) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '1.75rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 140, height: 140,
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div className="badge badge-red" style={{ marginBottom: '0.65rem' }}>
              <Sparkles size={12} /> {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {greeting}, {profile?.name?.split(' ')[0] || 'Athlete'}! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.92rem', maxWidth: 620 }}>
              {todayWorkout && !todayWorkout.isRestDay
                ? isTodayWorkoutLogged
                  ? `Great job! You already finished today's ${todayWorkout.focus} session.`
                  : `Today's Training: ${todayWorkout.focus} · ${todayWorkout.exercises?.length || 0} exercises scheduled.`
                : "Active Recovery Day: Focus on hydration, mobility, and nourishing whole foods."}
            </p>
          </div>

          {bodyAnalysis && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 12, padding: '0.75rem 1.25rem', textAlign: 'right', flexShrink: 0
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>
                {bodyAnalysis.bmi}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                Current BMI
              </div>
              <span className={`badge ${bodyAnalysis.bmiCategory === 'Normal weight' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: '0.35rem' }}>
                {bodyAnalysis.bmiCategory}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ─── 2. PRIMARY ASSIGNMENT FEATURE: FRIDGE-TO-RECIPE HERO SPOTLIGHT ─── */}
      <section className="card card-interactive" style={{
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(18, 18, 24, 0.96) 100%)',
        border: '1.5px solid rgba(245, 158, 11, 0.35)',
        cursor: 'pointer'
      }} onClick={() => navigate('/nutrition')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: 280 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)', flexShrink: 0
            }}>
              <UtensilsCrossed size={28} color="#1a0f00" strokeWidth={2.5} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>PRIMARY ASSIGNMENT FEATURE</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Culinary Engine</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Fridge-to-Recipe AI Generator
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                {currentRecipe
                  ? `Active Recipe: "${currentRecipe.name}" (${currentRecipe.totalTimeMinutes}m cook time · ${currentRecipe.servings} servings)`
                  : "Type what ingredients you have in your fridge to generate a structured, scalable recipe with step timers."}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-recipe" onClick={(e) => { e.stopPropagation(); navigate('/nutrition'); }}>
              {currentRecipe ? 'Open Recipe Lab' : 'Launch Generator'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 3. REAL DYNAMIC METRICS GRID ───────────────────────── */}
      <section className="grid-4" style={{ marginBottom: '1.75rem' }} aria-label="Key Health & Fitness Metrics">
        <StatCard
          icon={Scale}
          label="Body Weight"
          value={profile?.weight ? `${profile.weight} kg` : '--'}
          sub={profile?.targetWeight ? `Target: ${profile.targetWeight} kg` : 'Stable weight goal'}
          color="var(--accent-purple)"
        />
        <StatCard
          icon={Flame}
          label="Calories Consumed"
          value={`${consumedCalories} / ${targetCalories}`}
          sub={`${remainingCalories} kcal remaining`}
          color="var(--accent-orange)"
        />
        <StatCard
          icon={Droplets}
          label="Hydration Goal"
          value={`${waterIntake}L / ${waterTarget}L`}
          sub={`${waterPct}% reached today`}
          color="var(--accent-blue)"
        />
        <StatCard
          icon={Award}
          label="Habits Completed"
          value={`${habitStats.percent}%`}
          sub={`${habitStats.completed} of ${habitStats.total} done today`}
          color="var(--accent-green)"
        />
      </section>

      {/* ─── 4. TODAY'S TRAINING & HABIT QUICK-LOOK ─────────────── */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Workout Card */}
        <section className="card card-workout" style={{ cursor: 'pointer' }} onClick={() => navigate('/workouts')} aria-label="Today's Workout">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
              <Dumbbell size={18} color="#ef4444" /> Today's Workout
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                Week: {weeklyStats.completedThisWeek}/{weeklyStats.plannedDays} Done
              </span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>

          {!workoutPlan ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                No workout plan generated yet.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => { e.stopPropagation(); navigate('/workouts'); }}
              >
                Generate Weekly Plan
              </button>
            </div>
          ) : todayWorkout?.isRestDay ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>😴</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Scheduled Rest Day</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Neuromuscular recovery and sleep restoration</div>
            </div>
          ) : (
            <>
              <div style={{
                background: isTodayWorkoutLogged ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                borderRadius: 10, padding: '0.875rem',
                border: `1px solid ${isTodayWorkoutLogged ? 'var(--accent-red)' : 'rgba(239, 68, 68, 0.25)'}`,
                marginBottom: '0.875rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {todayWorkout?.focus}
                  </div>
                  {isTodayWorkoutLogged && (
                    <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                      ✓ Completed Today
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{todayWorkout?.durationMinutes} min</span>
                  <span><Dumbbell size={12} style={{ display: 'inline', marginRight: 4 }} />{todayWorkout?.exercises?.length || 0} exercises</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {todayWorkout?.exercises?.slice(0, 3).map((ex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ex.name}</span> · {ex.sets} sets × {ex.reps} reps
                  </div>
                ))}
              </div>

              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/workouts/session/${todayWorkout?.day}`); }}
              >
                {isTodayWorkoutLogged ? 'Restart Stopwatch' : 'Start Session Stopwatch'}
              </button>
            </>
          )}
        </section>

        {/* Daily Habits & Quick Shortcuts Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Hydration & Habit Progress Bars */}
          <section className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tracker')} aria-label="Habits and Hydration">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <Droplets size={16} color="var(--accent-blue)" /> Daily Hydration
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                {waterIntake}L / {waterTarget}L
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${waterPct}%`, background: 'var(--accent-blue)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                <Award size={16} color="var(--accent-green)" /> Daily Habits Consistency
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                {habitStats.percent}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${habitStats.percent}%`, background: 'var(--accent-green)' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {habitStats.percent === 100 ? '✅ All daily habits completed!' : `${habitStats.completed} of ${habitStats.total} habits finished`}
            </div>
          </section>

          {/* Fast Navigation Shortcuts */}
          <section className="card" aria-label="Quick Actions">
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Fast Navigation Shortcuts
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'Recipe Lab', to: '/nutrition', icon: UtensilsCrossed, color: 'var(--accent-green)' },
                { label: 'Timetable', to: '/planner', icon: Calendar, color: 'var(--accent-purple)' },
                { label: 'Analytics', to: '/progress', icon: TrendingUp, color: 'var(--accent-blue)' },
              ].map(({ label, to, icon: Icon, color }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '0.75rem 0.5rem', height: 'auto', gap: '0.35rem'
                  }}
                >
                  <Icon size={18} color={color} />
                  <span style={{ fontSize: '0.72rem' }}>{label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
