import { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useWorkout } from '../context/WorkoutContext';
import { coachApi } from '../api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import {
  Sparkles, Check, AlertTriangle, ShieldCheck, Dumbbell,
  Apple, ArrowRight, HelpCircle, BookOpen, Lightbulb
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'How do I break through a fat-loss plateau while keeping strength?',
  'What should I eat 1 hour before and 30 minutes after training?',
  'How can I fix lower back discomfort during Romanian deadlifts?',
  'How do I maximize muscle recovery on active rest days?',
];

export default function AICoach() {
  const { profile } = useUser();
  const { workoutPlan } = useWorkout();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});

  // Race condition protection
  const activeRequestId = useRef(0);

  const ask = async (qText) => {
    const textToAsk = qText || question;
    if (!textToAsk.trim()) return;

    const reqId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const res = await coachApi.ask({
        question: textToAsk,
        profile: profile || {},
        currentPlan: workoutPlan || {},
      });

      if (activeRequestId.current !== reqId) return;

      if (res.success && res.data) {
        setResult(res.data);
        setCompletedSteps({});
      } else {
        throw new Error(res.error || 'Failed to get coach protocol');
      }
    } catch (err) {
      if (activeRequestId.current === reqId) {
        setError(err.message || 'Error communicating with AI coach');
      }
    } finally {
      if (activeRequestId.current === reqId) {
        setLoading(false);
      }
    }
  };

  const toggleStep = (index) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840, margin: '0 auto' }}>
      <PageHeader
        title="AI Fitness Coach & Protocol Generator"
        subtitle="Get structured, evidence-based training, nutrition, and recovery protocols tailored to your profile"
        badge="🧠 Expert Coach"
      />

      {/* Free-form Input Card */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(245,158,11,0.05))',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Sparkles size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Ask Coach a Free-Form Fitness Question
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.875rem' }}>
          Ask about training technique, nutrition timing, plateau breaking, or recovery. Answers are parsed into structured action cards and checkable protocols.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            className="form-input"
            placeholder="Type your training or nutrition question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(question)}
          />
          <button className="btn btn-primary" onClick={() => ask(question)} disabled={loading || !question.trim()}>
            {loading ? <div className="spinner spinner-sm" /> : <Sparkles size={16} />}
            Analyze
          </button>
        </div>

        {/* Suggested Queries */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Quick Prompts:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {SUGGESTED_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                className="selection-pill"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => {
                  setQuestion(sq);
                  ask(sq);
                }}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner text="Generating structured coach protocol..." />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <ErrorState
          title="Coach Consultation Error"
          message={error}
          onRetry={() => ask(question)}
        />
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: 'rgba(139,92,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            <Lightbulb size={28} color="var(--accent-purple)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Ready for your consultation
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 420, margin: '0 auto' }}>
            Choose one of the quick prompts above or enter a question to generate a structured coaching action plan.
          </p>
        </div>
      )}

      {/* Structured Result Display (NOT a chatbot! Structured cards, checklists, blocks!) */}
      {result && !loading && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Executive Summary Card */}
          <div className="card" style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BookOpen size={18} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Coach Executive Assessment
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {result.summary || result.response}
            </p>
          </div>

          {/* Actionable Steps Checklist Block */}
          {result.actionSteps && result.actionSteps.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <Check size={18} color="var(--accent-green)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Action Protocol (Check off as implemented)
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.actionSteps.map((step, idx) => {
                  const isDone = completedSteps[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.75rem', borderRadius: 8, cursor: 'pointer',
                        background: isDone ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isDone ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: `1.5px solid ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'}`,
                        background: isDone ? 'var(--accent-green)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 2, flexShrink: 0
                      }}>
                        {isDone && <Check size={14} color="white" strokeWidth={3} />}
                      </div>
                      <span style={{
                        fontSize: '0.85rem',
                        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        lineHeight: 1.5
                      }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specialized Blocks: Nutrition Tip & Workout Tip */}
          <div className="grid-2">
            {result.nutritionTip && (
              <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Apple size={18} color="var(--accent-green)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Nutrition & Hydration Cue
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {result.nutritionTip}
                </p>
              </div>
            )}

            {result.workoutTip && (
              <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Dumbbell size={18} color="var(--accent-blue)" />
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Training & Mechanics Cue
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {result.workoutTip}
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer / Caution Block */}
          {result.caution && (
            <div style={{
              padding: '0.875rem', borderRadius: 'var(--radius)',
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)'
            }}>
              <AlertTriangle size={16} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: 'var(--accent-orange)' }}>Safety Note:</strong> {result.caution}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
