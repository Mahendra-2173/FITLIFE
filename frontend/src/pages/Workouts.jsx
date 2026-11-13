import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useWorkout } from '../context/WorkoutContext';
import { workoutApi } from '../api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import {
  Dumbbell, RefreshCw, Play, Moon, Clock, ChevronRight, CheckCircle2,
  Zap, Sparkles, Filter, AlertCircle
} from 'lucide-react';

const DAY_COLORS = ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'];

export default function Workouts() {
  const navigate = useNavigate();
  const { profile } = useUser();
  const { workoutPlan, savePlan } = useWorkout();

  const [customPrompt, setCustomPrompt] = useState('');
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stale request race-condition protection (PDF requirement!)
  const activeRequestId = useRef(0);

  const generate = async (isRefinement = false) => {
    if (!profile) return;
    const reqId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    const promptToSend = isRefinement ? refinementPrompt : customPrompt;

    try {
      const res = await workoutApi.generate(profile, promptToSend);

      // Discard if a newer request was dispatched
      if (activeRequestId.current !== reqId) return;

      if (res.success && res.data) {
        savePlan(res.data);
        if (isRefinement) setRefinementPrompt('');
      } else {
        throw new Error(res.error || 'Failed to generate plan');
      }
    } catch (err) {
      if (activeRequestId.current === reqId) {
        setError(err.message || 'Error communicating with AI engine');
      }
    } finally {
      if (activeRequestId.current === reqId) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <PageHeader
        title="AI Workout Generator & Schedule"
        subtitle="Your personalized weekly training split with interactive guidance and exercise alternatives"
        badge="🏋️ Smart Training"
        action={
          <button className="btn btn-secondary" onClick={() => generate(false)} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Regenerate
          </button>
        }
      />

      {/* Free-form Natural Language Prompt Bar (PDF Requirement!) */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Sparkles size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Free-Form Workout Customizer
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          Describe any specific routine, equipment you have, or limitations in natural text (e.g. <em>"Focus on chest and triceps with dumbbells only, keep it under 40 minutes, avoid heavy overhead pressing due to shoulder ache"</em>).
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 260 }}
            placeholder="Type your custom workout instructions or constraints..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate(false)}
          />
          <button className="btn btn-primary" onClick={() => generate(false)} disabled={loading}>
            {loading ? <div className="spinner spinner-sm" /> : <Sparkles size={16} />}
            Generate Plan
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner text="Generating your personalized training schedule..." />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Could not generate workout plan"
          message={error}
          onRetry={() => generate(false)}
        />
      )}

      {!workoutPlan && !loading && !error && (
        <EmptyState
          icon={Dumbbell}
          title="No workout plan generated yet"
          description="Type your custom fitness instructions above or click generate to build your weekly plan."
          action={
            <button className="btn btn-primary btn-lg" onClick={() => generate(false)}>
              <Zap size={18} /> Generate My Workout Plan
            </button>
          }
        />
      )}

      {workoutPlan && !loading && (
        <>
          {/* Weekly Overview Pills */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: '0.75rem',
            marginBottom: '1.5rem', paddingBottom: '0.5rem'
          }}>
            {workoutPlan.weeklyPlan.map((day, i) => {
              const isToday = day.day === ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
              return (
                <div
                  key={day.day}
                  onClick={() => !day.isRestDay && navigate(`/workouts/session/${day.day}`)}
                  style={{
                    minWidth: 105, background: isToday ? `${DAY_COLORS[i]}20` : 'var(--bg-card)',
                    border: `1px solid ${isToday ? DAY_COLORS[i] : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius)', padding: '0.875rem 0.75rem',
                    textAlign: 'center', cursor: day.isRestDay ? 'default' : 'pointer',
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                  onMouseEnter={(e) => { if (!day.isRestDay) e.currentTarget.style.borderColor = DAY_COLORS[i]; }}
                  onMouseLeave={(e) => { if (!isToday) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.3rem' }}>
                    {day.day.substring(0, 3)}
                  </div>
                  <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>
                    {day.isRestDay ? '😴' : '🏋️'}
                  </div>
                  {isToday && (
                    <div className="badge badge-purple" style={{ fontSize: '0.6rem', marginBottom: '0.3rem' }}>Today</div>
                  )}
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {day.isRestDay ? 'Rest' : day.focus.split(' ')[0]}
                  </div>
                  {!day.isRestDay && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {day.exercises?.length || 0} exercises
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {workoutPlan.weeklyPlan.map((day, i) => {
              const isToday = day.day === ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
              return (
                <div key={day.day} className="card" style={{
                  borderColor: isToday ? `${DAY_COLORS[i]}50` : 'var(--border-color)',
                  background: isToday ? `${DAY_COLORS[i]}08` : 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        background: day.isRestDay ? 'rgba(100,116,139,0.15)' : `${DAY_COLORS[i]}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem', flexShrink: 0
                      }}>
                        {day.isRestDay ? '😴' : '💪'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{day.day}</span>
                          {isToday && <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Today</span>}
                          {day.isRestDay && <span className="badge" style={{ background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>Rest Day</span>}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.15rem' }}>
                          {day.focus}
                        </div>
                        {!day.isRestDay && (
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} /> {day.durationMinutes} min
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Dumbbell size={11} /> {day.exercises?.length || 0} exercises
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!day.isRestDay && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/workouts/session/${day.day}`)}
                        style={{ background: `linear-gradient(135deg, ${DAY_COLORS[i]}, ${DAY_COLORS[i]}cc)`, flexShrink: 0 }}
                      >
                        <Play size={14} /> Start Session
                      </button>
                    )}
                  </div>

                  {/* Exercises Preview */}
                  {!day.isRestDay && day.exercises?.length > 0 && (
                    <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.875rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {day.exercises.map((ex, j) => (
                          <span key={j} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                            {ex.name} ({ex.sets}×{ex.reps})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Refinement Loop (PDF Stretch Goal!) */}
          <div className="card" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed var(--border-color)',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Refine Workout Plan with AI
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Follow-up prompt to edit your existing routine without regenerating from scratch (e.g. <em>"Swap leg day to Saturday and make Wednesday an active core day"</em>).
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="form-input"
                placeholder="Type your adjustment request..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate(true)}
              />
              <button
                className="btn btn-secondary"
                onClick={() => generate(true)}
                disabled={loading || !refinementPrompt.trim()}
              >
                Refine
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
