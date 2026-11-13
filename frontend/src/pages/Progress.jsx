import { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { useWorkout } from '../context/WorkoutContext';
import { useNutrition } from '../context/NutritionContext';
import { useHabit } from '../context/HabitContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  TrendingUp, Award, Calendar, Flame, Scale, Plus,
  CheckCircle2, Dumbbell, Droplets, Clock, Trash2,
  AlertCircle, Sparkles, Check
} from 'lucide-react';

export default function Progress() {
  const { profile, bodyAnalysis, weightLogs, addWeightLog, deleteWeightLog, measurements, saveMeasurements } = useUser();
  const { sessions, workoutPlan, getWeeklyWorkoutStats } = useWorkout();
  const { waterIntake, waterTarget, waterHistory, getTodayCalories } = useNutrition();
  const { getHabitHistory, getTodayStats } = useHabit();

  const currentW = profile?.weight ? parseFloat(profile.weight) : null;
  const targetW = profile?.targetWeight ? parseFloat(profile.targetWeight) : null;

  // New weight entry input
  const [newWeight, setNewWeight] = useState('');
  const [weightError, setWeightError] = useState(null);
  const [logSuccessNotice, setLogSuccessNotice] = useState(null);

  // Circumference measurements input
  const [measureInput, setMeasureInput] = useState({
    waist: measurements?.waist || '',
    chest: measurements?.chest || '',
    hips: measurements?.hips || '',
  });

  // Calculate real metrics
  const weeklyStats = getWeeklyWorkoutStats();
  const todayCalories = getTodayCalories();
  const calorieTarget = bodyAnalysis?.calorieTarget || 2000;
  const habitStats = getTodayStats();
  const habitHistory7Days = getHabitHistory(7);

  const weightDiff = currentW && targetW ? (currentW - targetW).toFixed(1) : null;

  const handleAddWeight = (e) => {
    e.preventDefault();
    setWeightError(null);
    try {
      addWeightLog(newWeight);
      setNewWeight('');
      setLogSuccessNotice('Weight log saved successfully!');
      setTimeout(() => setLogSuccessNotice(null), 3000);
    } catch (err) {
      setWeightError(err.message || 'Invalid weight value');
    }
  };

  const handleUpdateMeasurements = (e) => {
    e.preventDefault();
    const updated = {
      waist: measureInput.waist ? parseFloat(measureInput.waist) : measurements?.waist || null,
      chest: measureInput.chest ? parseFloat(measureInput.chest) : measurements?.chest || null,
      hips: measureInput.hips ? parseFloat(measureInput.hips) : measurements?.hips || null,
    };
    saveMeasurements(updated);
    setLogSuccessNotice('Body circumference metrics updated!');
    setTimeout(() => setLogSuccessNotice(null), 3000);
  };

  // Build real 7-day hydration dataset from actual waterHistory
  const hydration7DayData = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en-US', { weekday: 'short' });

      // Match in waterHistory or today's waterIntake
      let amount = 0;
      if (i === 0) {
        amount = waterIntake;
      } else {
        const found = waterHistory.find((w) => w.date === dateKey);
        if (found) amount = found.amount;
      }

      result.push({
        date: label,
        amount: parseFloat(amount.toFixed(2)),
        target: waterTarget,
      });
    }
    return result;
  }, [waterHistory, waterIntake, waterTarget]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      <PageHeader
        title="Fitness Progress & Analytics"
        subtitle="Empirical analytics calculated exclusively from your real logged workouts, habits, weight, and hydration"
        badge="📈 Health Analytics"
      />

      {logSuccessNotice && (
        <div style={{
          background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-green)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
          color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', fontWeight: 600
        }}>
          <Check size={16} /> {logSuccessNotice}
        </div>
      )}

      {/* ─── 1. REAL METRIC STAT CARDS ──────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={Scale}
          label="Current Weight"
          value={currentW ? `${currentW} kg` : '--'}
          sub={targetW ? `Target: ${targetW} kg` : 'Stable weight goal'}
          color="var(--accent-purple)"
        />
        <StatCard
          icon={TrendingUp}
          label="Weight Goal Delta"
          value={
            weightDiff !== null
              ? `${weightDiff > 0 ? '-' : '+'}${Math.abs(weightDiff)} kg`
              : '--'
          }
          sub={
            weightDiff !== null
              ? weightDiff <= 0 ? 'Goal accomplished!' : 'To reach target weight'
              : 'Set target in profile'
          }
          color="var(--accent-green)"
        />
        <StatCard
          icon={Dumbbell}
          label="Workouts Completed"
          value={sessions.length}
          sub={
            sessions.length === 0
              ? 'No sessions yet'
              : `${weeklyStats.completedThisWeek} completed this week`
          }
          color="var(--accent-blue)"
        />
        <StatCard
          icon={Award}
          label="Weekly Adherence"
          value={`${weeklyStats.adherencePct}%`}
          sub={`${weeklyStats.completedThisWeek} of ${weeklyStats.plannedDays} planned sessions`}
          color="var(--accent-orange)"
        />
      </div>

      {/* ─── 2. WEIGHT TRAJECTORY CHART (REAL DATA ONLY) ─────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Weight Trajectory (kg)
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real historical progression toward your goal ({weightLogs.length} record{weightLogs.length === 1 ? '' : 's'} logged)
            </div>
          </div>

          {/* Quick weight logger */}
          <form onSubmit={handleAddWeight} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              step="0.1"
              placeholder="Log weight (kg)..."
              className="form-input form-input-sm"
              style={{ width: 140 }}
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={14} /> Log Entry
            </button>
          </form>
        </div>

        {weightError && (
          <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            {weightError}
          </div>
        )}

        {weightLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Scale size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No weight data logged yet</p>
            <p style={{ fontSize: '0.8rem', maxWidth: 380, margin: '0.25rem auto' }}>
              Log your current weight using the input above to begin tracking your physical transformation over time.
            </p>
          </div>
        ) : weightLogs.length === 1 ? (
          <div style={{
            background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)',
            borderRadius: 10, padding: '2rem', textAlign: 'center', margin: '0.5rem 0'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-purple)' }}>
              {weightLogs[0].weight} kg
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              First record logged on {weightLogs[0].date}. Add future check-ins to render the progress curve!
            </div>
          </div>
        ) : (
          <div style={{ height: 260, width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'white',
                  }}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── 3. HABIT & HYDRATION 7-DAY REAL TRENDS ───────────────── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Habit Consistency (Real 7-day logs) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                7-Day Habit Completion
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Today: {habitStats.completed}/{habitStats.total} done ({habitStats.percent}%)
              </div>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
              {habitStats.percent}% Today
            </span>
          </div>

          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitHistory7Days} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'white',
                  }}
                  formatter={(value) => [`${value}%`, 'Habits Completed']}
                />
                <Bar dataKey="percent" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hydration 7-Day Trend */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                7-Day Hydration (Litres)
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Target: {waterTarget}L daily
              </div>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              {waterIntake}L Today
            </span>
          </div>

          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hydration7DayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, Math.max(4, waterTarget + 0.5)]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'white',
                  }}
                  formatter={(value) => [`${value} Litres`, 'Water Logged']}
                />
                <Bar dataKey="amount" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 4. CIRCUMFERENCE MEASUREMENTS & COMPLETED WORKOUTS ──── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Circumference Metrics */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Circumference Metrics (cm)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>WAIST</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                {measurements?.waist ? `${measurements.waist} cm` : '--'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CHEST</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {measurements?.chest ? `${measurements.chest} cm` : '--'}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>HIPS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {measurements?.hips ? `${measurements.hips} cm` : '--'}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateMeasurements} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="grid-3" style={{ gap: '0.5rem' }}>
              <input
                className="form-input form-input-sm"
                placeholder="Waist (cm)"
                type="number"
                step="0.5"
                value={measureInput.waist}
                onChange={(e) => setMeasureInput({ ...measureInput, waist: e.target.value })}
              />
              <input
                className="form-input form-input-sm"
                placeholder="Chest (cm)"
                type="number"
                step="0.5"
                value={measureInput.chest}
                onChange={(e) => setMeasureInput({ ...measureInput, chest: e.target.value })}
              />
              <input
                className="form-input form-input-sm"
                placeholder="Hips (cm)"
                type="number"
                step="0.5"
                value={measureInput.hips}
                onChange={(e) => setMeasureInput({ ...measureInput, hips: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-end', marginTop: 4 }}>
              Update Measurements
            </button>
          </form>
        </div>

        {/* Completed Workouts Log */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Completed Workouts Log
            </h2>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
              {sessions.length} Logged
            </span>
          </div>

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Dumbbell size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              No workout sessions completed yet.<br />
              Launch the Stopwatch on any workout day to track real sessions!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
              {sessions.slice().reverse().map((session, idx) => (
                <div
                  key={session.id || idx}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.6rem 0.8rem', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {session.focus || session.day}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {session.day} · {session.durationMinutes || 45} mins · {session.exercisesCompleted || 'All'} exercises
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                    ✓ Logged
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
