import { useState } from 'react';
import { useNutrition } from '../context/NutritionContext';
import { useUser } from '../context/UserContext';
import { useHabit } from '../context/HabitContext';
import PageHeader from '../components/PageHeader';
import ProgressRing from '../components/ProgressRing';
import {
  Droplets, Moon, Footprints, Flame, Plus,
  RotateCcw, Clock, Award, CheckCircle2, Check,
  Trash2, Edit3, X, Sparkles, AlertCircle
} from 'lucide-react';

const CATEGORY_TAGS = {
  hydration: { label: 'Hydration', color: 'var(--accent-blue)' },
  fitness: { label: 'Fitness', color: 'var(--accent-green)' },
  nutrition: { label: 'Nutrition', color: '#10b981' },
  recovery: { label: 'Recovery', color: 'var(--accent-purple)' },
  mindfulness: { label: 'Mindfulness', color: 'var(--accent-orange)' },
  general: { label: 'Habit', color: '#94a3b8' },
};

const EMOJI_OPTIONS = ['💧', '🏋️', '🥗', '😴', '🧘', '🚶', '🍎', '☀️', '📖', '🍵', '💊', '⚡'];

export default function ActivityTracker() {
  const { waterIntake, waterTarget, setWaterTarget, addWater, resetWater } = useNutrition();
  const { profile } = useUser();
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    isHabitCompleted,
    getTodayStats,
  } = useHabit();

  // Habit management modal / edit state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [habitForm, setHabitForm] = useState({ title: '', category: 'fitness', emoji: '⭐' });
  const [habitError, setHabitError] = useState(null);

  // Custom water target editing state
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState(waterTarget.toString());

  // Sleep state
  const [sleepHours, setSleepHours] = useState(profile?.sleepDuration || 7.5);
  const [sleepQuality, setSleepQuality] = useState('good');
  const [sleepLogs, setSleepLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('fitlife_sleep_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Steps state
  const [steps, setSteps] = useState(() => {
    try {
      const saved = localStorage.getItem('fitlife_steps');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [stepInput, setStepInput] = useState('');
  const targetSteps = 10000;

  // Hydration calculations
  const waterPercent = Math.min(100, Math.round((waterIntake / waterTarget) * 100));
  const remainingWater = Math.max(0, parseFloat((waterTarget - waterIntake).toFixed(2)));

  // Habit stats
  const { total: totalHabits, completed: completedHabits, percent: habitPercent } = getTodayStats();

  const handleSaveHabit = (e) => {
    e.preventDefault();
    setHabitError(null);
    try {
      if (editingHabitId) {
        updateHabit(editingHabitId, habitForm);
        setEditingHabitId(null);
      } else {
        addHabit(habitForm);
      }
      setHabitForm({ title: '', category: 'fitness', emoji: '⭐' });
      setShowAddModal(false);
    } catch (err) {
      setHabitError(err.message || 'Failed to save habit');
    }
  };

  const startEditHabit = (h) => {
    setEditingHabitId(h.id);
    setHabitForm({ title: h.title, category: h.category, emoji: h.emoji });
    setShowAddModal(true);
    setHabitError(null);
  };

  const handleDeleteHabit = (id, title) => {
    if (window.confirm(`Are you sure you want to delete the habit "${title}"?`)) {
      deleteHabit(id);
    }
  };

  const handleSaveWaterTarget = (e) => {
    e.preventDefault();
    const val = parseFloat(customTargetInput);
    if (!isNaN(val) && val >= 1 && val <= 8) {
      setWaterTarget(val);
      setIsEditingTarget(false);
    }
  };

  const logSleep = () => {
    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: parseFloat(sleepHours),
      quality: sleepQuality,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...sleepLogs.slice(0, 6)];
    setSleepLogs(updated);
    try {
      localStorage.setItem('fitlife_sleep_logs', JSON.stringify(updated));
    } catch (e) {}
  };

  const addSteps = (e) => {
    e.preventDefault();
    const val = parseInt(stepInput, 10);
    if (!isNaN(val) && val > 0) {
      const nextSteps = steps + val;
      setSteps(nextSteps);
      try {
        localStorage.setItem('fitlife_steps', nextSteps.toString());
      } catch (e) {}
      setStepInput('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 920, margin: '0 auto' }}>
      <PageHeader
        title="Habits & Daily Hydration"
        subtitle="Build consistency with daily custom habits, hydration goals, restorative sleep, and step tracking"
        badge="💧 Habits & Hydration"
        action={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingHabitId(null);
              setHabitForm({ title: '', category: 'fitness', emoji: '⭐' });
              setHabitError(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={14} /> New Habit
          </button>
        }
      />

      {/* ─── 1. TOP ROW: HYDRATION & HABIT SCORE ─────────────────── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Hydration Tracker Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Droplets size={20} color="var(--accent-blue)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Hydration Tracker
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Goal: {waterTarget}L per day
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsEditingTarget(!isEditingTarget)}
                title="Edit daily target"
              >
                <Edit3 size={14} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (window.confirm('Reset today\'s water intake to 0L?')) {
                    resetWater();
                  }
                }}
                title="Reset for today"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {isEditingTarget && (
            <form onSubmit={handleSaveWaterTarget} style={{
              display: 'flex', gap: '0.5rem', marginBottom: '1rem',
              padding: '0.6rem', background: 'rgba(59,130,246,0.08)', borderRadius: 8
            }}>
              <input
                type="number"
                step="0.1"
                min="1"
                max="8"
                className="form-input form-input-sm"
                value={customTargetInput}
                onChange={(e) => setCustomTargetInput(e.target.value)}
                placeholder="Target in Litres"
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">Set Goal</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditingTarget(false)}>Cancel</button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <ProgressRing
              value={waterIntake}
              max={waterTarget}
              size={135}
              strokeWidth={10}
              color="var(--accent-blue)"
              label={`${waterIntake}L`}
              sublabel={`of ${waterTarget}L`}
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              fontSize: '0.85rem', fontWeight: 700,
              color: waterPercent >= 100 ? 'var(--accent-green)' : 'var(--text-primary)'
            }}>
              {waterPercent >= 100 ? '🎉 Daily Hydration Goal Accomplished!' : `${remainingWater}L remaining to drink today`}
            </div>
          </div>

          {/* Quick-add buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => addWater(0.25)} style={{ padding: '0.5rem 0.25rem' }}>
              +250ml
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => addWater(0.5)} style={{ padding: '0.5rem 0.25rem' }}>
              +500ml
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => addWater(0.75)} style={{ padding: '0.5rem 0.25rem' }}>
              +750ml
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => addWater(1.0)} style={{ padding: '0.5rem 0.25rem' }}>
              +1.0L
            </button>
          </div>
        </div>

        {/* Habit Completion Overview Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Award size={20} color="var(--accent-green)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Today's Habit Score
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {completedHabits} of {totalHabits} completed
                </div>
              </div>
            </div>

            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              {habitPercent}% Score
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <ProgressRing
              value={completedHabits}
              max={Math.max(1, totalHabits)}
              size={135}
              strokeWidth={10}
              color="var(--accent-green)"
              label={`${habitPercent}%`}
              sublabel={`${completedHabits}/${totalHabits} Done`}
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: habitPercent === 100 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              {totalHabits === 0
                ? 'No habits tracked yet. Create your first habit!'
                : habitPercent === 100
                ? '⭐ Perfect consistency! All daily habits complete.'
                : `${totalHabits - completedHabits} more habit${totalHabits - completedHabits === 1 ? '' : 's'} to hit 100%`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Consistent small actions compound into life-changing fitness results
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={() => {
              setEditingHabitId(null);
              setHabitForm({ title: '', category: 'fitness', emoji: '⭐' });
              setHabitError(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={14} /> Add Custom Habit
          </button>
        </div>
      </div>

      {/* ─── 2. INTERACTIVE HABITS CHECKLIST (Full CRUD) ─────────── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daily Habits Checklist
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Check off your daily health, fitness, and lifestyle rituals
            </div>
          </div>

          <div className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Sparkles size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You don't have any habits configured yet.</p>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '0.75rem' }}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} /> Create Your First Habit
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {habits.map((habit) => {
              const isDone = isHabitCompleted(habit.id);
              const tagInfo = CATEGORY_TAGS[habit.category] || CATEGORY_TAGS.general;

              return (
                <div
                  key={habit.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: 'var(--radius)',
                    background: isDone ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    onClick={() => toggleHabit(habit.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      border: `1.5px solid ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                      background: isDone ? 'var(--accent-green)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isDone && <Check size={16} color="#042f1a" strokeWidth={3} />}
                    </div>

                    <span style={{ fontSize: '1.25rem' }}>{habit.emoji || '⭐'}</span>

                    <div>
                      <div style={{
                        fontSize: '0.92rem', fontWeight: 600,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none'
                      }}>
                        {habit.title}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: 2 }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.62rem',
                            background: `${tagInfo.color}15`,
                            color: tagInfo.color
                          }}
                        >
                          {tagInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Habit Controls: Edit & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      className="btn btn-icon btn-ghost"
                      style={{ padding: 4 }}
                      onClick={() => startEditHabit(habit)}
                      title="Edit Habit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost"
                      style={{ padding: 4, color: 'var(--accent-red)' }}
                      onClick={() => handleDeleteHabit(habit.id, habit.title)}
                      title="Delete Habit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 3. SLEEP & STEPS TRACKING ROW ──────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Steps Tracker */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(236,72,153,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Footprints size={20} color="#ec4899" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Movement & Steps
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Target: {targetSteps.toLocaleString()} steps
                </div>
              </div>
            </div>
            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
              {Math.min(100, Math.round((steps / targetSteps) * 100))}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <ProgressRing
              value={steps}
              max={targetSteps}
              size={130}
              strokeWidth={10}
              color="#ec4899"
              label={`${steps.toLocaleString()}`}
              sublabel={`of ${targetSteps.toLocaleString()}`}
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: steps >= targetSteps ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              {steps >= targetSteps ? '🏆 Daily Step Goal Achieved!' : `${(targetSteps - steps).toLocaleString()} steps left`}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Est. Distance: {(steps * 0.0008).toFixed(1)} km · ~{Math.round(steps * 0.04)} kcal
            </div>
          </div>

          <form onSubmit={addSteps} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              className="form-input form-input-sm"
              placeholder="Add steps (e.g. 1500)..."
              value={stepInput}
              onChange={(e) => setStepInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add
            </button>
          </form>
        </div>

        {/* Sleep Tracker */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Moon size={20} color="#6366f1" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Sleep & Recovery
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Target: {profile?.sleepDuration || 7.5} hours
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hours Slept:</span>
              <span style={{ fontWeight: 800, color: '#6366f1' }}>{sleepHours} hrs</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>4h (Low)</span>
              <span>8h (Ideal)</span>
              <span>12h</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Sleep Quality</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              {[
                { id: 'fair', label: '🥱 Restless' },
                { id: 'good', label: '😊 Restful' },
                { id: 'great', label: '⚡ Deep' },
              ].map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`selection-pill ${sleepQuality === q.id ? 'selected' : ''}`}
                  onClick={() => setSleepQuality(q.id)}
                  style={{ textAlign: 'center', padding: '0.4rem 0.2rem', fontSize: '0.75rem' }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={logSleep} style={{ width: '100%' }}>
            Log Sleep Entry
          </button>

          {sleepLogs.length > 0 && (
            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {sleepLogs.slice(0, 2).map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.45rem 0.65rem', borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem'
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{log.date}</span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>{log.hours}h ({log.quality})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. ADD / EDIT HABIT MODAL ──────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 110
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingHabitId ? 'Edit Habit' : 'Create New Habit'}
              </h3>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {habitError && (
              <div style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid var(--accent-red)',
                borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '1rem',
                color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <AlertCircle size={14} /> {habitError}
              </div>
            )}

            <form onSubmit={handleSaveHabit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Habit Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. 15-Minute Morning Mobility Stretch"
                  value={habitForm.title}
                  onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input form-select"
                  value={habitForm.category}
                  onChange={(e) => setHabitForm({ ...habitForm, category: e.target.value })}
                >
                  <option value="fitness">Fitness & Movement</option>
                  <option value="hydration">Hydration</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="recovery">Recovery & Sleep</option>
                  <option value="mindfulness">Mindfulness & Mental Health</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Emoji Icon</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setHabitForm({ ...habitForm, emoji })}
                      style={{
                        width: 38, height: 38, borderRadius: 8, fontSize: '1.2rem',
                        border: habitForm.emoji === emoji ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                        background: habitForm.emoji === emoji ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHabitId ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
