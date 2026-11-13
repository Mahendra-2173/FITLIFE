import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useWorkout } from '../context/WorkoutContext';
import { scheduleApi } from '../api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  Calendar, Clock, Check, Plus, Trash2, ArrowUp, ArrowDown,
  Sparkles, RefreshCw, CheckCircle2, ChevronRight
} from 'lucide-react';

const CATEGORY_COLORS = {
  workout: 'var(--accent-green)',
  nutrition: 'var(--accent-green)',
  hydration: 'var(--accent-blue)',
  sleep: 'var(--accent-purple)',
  recovery: 'var(--accent-orange)',
  activity: '#38bdf8',
};

export default function DailyPlanner() {
  const { profile } = useUser();
  const { getTodayWorkout } = useWorkout();
  const [schedule, setSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('fitlife_schedule');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [routineInput, setRoutineInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    time: '04:00 PM',
    activity: '',
    description: '',
    duration: 30,
    category: 'activity',
    emoji: '⭐',
  });

  // Stale request protection
  const activeRequestId = useRef(0);

  const todayWorkout = getTodayWorkout();

  const saveAndSetSchedule = (newSched) => {
    setSchedule(newSched);
    try {
      localStorage.setItem('fitlife_schedule', JSON.stringify(newSched));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  const generateSchedule = async () => {
    const reqId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await scheduleApi.generate({
        profile: profile || {},
        workoutDay: todayWorkout || {},
        customRoutine: routineInput,
      });

      if (activeRequestId.current !== reqId) return;

      if (res.success && res.data?.schedule) {
        saveAndSetSchedule(res.data.schedule);
        setRoutineInput('');
      } else {
        throw new Error(res.error || 'Failed to generate daily schedule');
      }
    } catch (err) {
      if (activeRequestId.current === reqId) {
        setError(err.message || 'Error generating schedule. Please try again.');
      }
    } finally {
      if (activeRequestId.current === reqId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!schedule && profile) {
      generateSchedule();
    }
  }, []);

  const toggleCompleted = (id) => {
    const updated = schedule.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveAndSetSchedule(updated);
  };

  const removeActivity = (id) => {
    if (window.confirm('Are you sure you want to remove this activity from your schedule?')) {
      const updated = schedule.filter((item) => item.id !== id);
      saveAndSetSchedule(updated);
    }
  };

  const moveActivity = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= schedule.length) return;
    const reordered = [...schedule];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    saveAndSetSchedule(reordered);
  };

  const addCustomActivity = (e) => {
    e.preventDefault();
    if (!newActivity.activity.trim()) return;
    const entry = {
      ...newActivity,
      id: `custom_${Date.now()}`,
      completed: false,
    };
    saveAndSetSchedule([...(schedule || []), entry]);
    setShowAddModal(false);
    setNewActivity({
      time: '04:00 PM',
      activity: '',
      description: '',
      duration: 30,
      category: 'activity',
      emoji: '⭐',
    });
  };

  const completedCount = schedule?.filter((s) => s.completed).length || 0;
  const totalCount = schedule?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840, margin: '0 auto' }}>
      <PageHeader
        title="Daily Planner & Timetable"
        subtitle="Your personalized daily routine with activity timings, check-ins, and flexible reordering"
        badge="⏱️ Daily Timetable"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Activity
            </button>
            <button className="btn btn-primary btn-sm" onClick={generateSchedule} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Regenerate
            </button>
          </div>
        }
      />

      {/* Free-form Custom Routine Input */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Sparkles size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Customize Schedule With Natural Language
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          Describe your day constraints (e.g. <em>"I have meetings 9am-1pm, want to work out at 5:30pm, and dinner at 8pm"</em>).
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="form-input"
            placeholder="Type your daily schedule constraints..."
            value={routineInput}
            onChange={(e) => setRoutineInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateSchedule()}
          />
          <button className="btn btn-primary" onClick={generateSchedule} disabled={loading}>
            {loading ? <div className="spinner spinner-sm" /> : <Sparkles size={16} />}
            Generate
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && <ErrorState message={error} onRetry={generateSchedule} />}

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner text="Optimizing your daily fitness schedule..." />
        </div>
      )}

      {/* Empty state */}
      {!schedule && !loading && !error && (
        <EmptyState
          icon={Calendar}
          title="No daily timetable yet"
          description="Generate a daily schedule designed around your training, meals, hydration, and sleep."
          action={
            <button className="btn btn-primary" onClick={generateSchedule}>
              Generate Timetable
            </button>
          }
        />
      )}

      {/* Schedule Content */}
      {schedule && !loading && (
        <>
          {/* Daily Completion Header */}
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Today's Progress
                </span>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {completedCount} of {totalCount} completed ({progressPercent}%)
                </div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: progressPercent === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: progressPercent === 100 ? 'var(--accent-green)' : 'var(--accent-purple)',
                fontWeight: 800, fontSize: '0.9rem'
              }}>
                {progressPercent}%
              </div>
            </div>

            <div className="progress-bar" style={{ height: 8 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent === 100 ? 'var(--accent-green)' : 'var(--gradient-purple)'
                }}
              />
            </div>
          </div>

          {/* Activities Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {schedule.map((item, index) => {
              const catColor = CATEGORY_COLORS[item.category] || 'var(--accent-purple)';

              return (
                <div
                  key={item.id || index}
                  className="card"
                  style={{
                    padding: '1rem',
                    borderLeft: `4px solid ${catColor}`,
                    background: item.completed ? 'rgba(255,255,255,0.01)' : 'var(--bg-card)',
                    opacity: item.completed ? 0.75 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1 }}>
                      {/* Completion Checkbox */}
                      <button
                        onClick={() => toggleCompleted(item.id)}
                        style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: item.completed ? 'var(--accent-green)' : 'transparent',
                          border: `1.5px solid ${item.completed ? 'var(--accent-green)' : 'var(--border-color)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'white', flexShrink: 0
                        }}
                      >
                        {item.completed && <Check size={16} strokeWidth={3} />}
                      </button>

                      <div style={{ fontSize: '1.4rem' }}>{item.emoji || '📅'}</div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontWeight: 700, fontSize: '0.95rem',
                            color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: item.completed ? 'line-through' : 'none'
                          }}>
                            {item.activity}
                          </span>
                          <span className="badge" style={{ fontSize: '0.65rem', background: `${catColor}18`, color: catColor }}>
                            {item.time}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {item.duration} min
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {/* Reorder and Delete Controls (PDF Trip/Planner Requirement!) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ padding: 4 }}
                        disabled={index === 0}
                        onClick={() => moveActivity(index, -1)}
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ padding: 4 }}
                        disabled={index === schedule.length - 1}
                        onClick={() => moveActivity(index, 1)}
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ padding: 4, color: 'var(--accent-red)' }}
                        onClick={() => removeActivity(item.id)}
                        title="Remove Activity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add Custom Activity Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 100
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Add Activity to Schedule
            </h3>

            <form onSubmit={addCustomActivity} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Name</label>
                <input
                  className="form-input"
                  placeholder="e.g., Pre-workout Mobility Stretch"
                  value={newActivity.activity}
                  onChange={(e) => setNewActivity({ ...newActivity, activity: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Scheduled Time</label>
                  <input
                    className="form-input"
                    placeholder="04:30 PM"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity({ ...newActivity, duration: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input form-select"
                  value={newActivity.category}
                  onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                >
                  <option value="workout">Workout</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="hydration">Hydration</option>
                  <option value="sleep">Sleep</option>
                  <option value="recovery">Recovery</option>
                  <option value="activity">General Activity</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  className="form-input"
                  placeholder="Additional cues or notes..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
