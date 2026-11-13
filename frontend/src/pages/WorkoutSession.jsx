import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { useUser } from '../context/UserContext';
import { workoutApi } from '../api';
import PageHeader from '../components/PageHeader';
import {
  Play, Pause, RotateCcw, Check, SkipForward, ArrowLeft,
  ArrowRight, RefreshCw, Trophy, Dumbbell, Clock, Flame, AlertCircle
} from 'lucide-react';

export default function WorkoutSession() {
  const { day } = useParams();
  const navigate = useNavigate();
  const { workoutPlan, completeSession } = useWorkout();
  const { profile } = useUser();

  const currentDayPlan = workoutPlan?.weeklyPlan?.find(
    (d) => d.day.toLowerCase() === day?.toLowerCase()
  );

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const exercises = currentDayPlan?.exercises || [];
  const currentExercise = exercises[exerciseIndex];
  const totalSets = currentExercise?.sets || 3;

  // Session duration timer with proper interval cleanup
  useEffect(() => {
    let interval = null;
    if (!workoutComplete && !isPaused) {
      interval = setInterval(() => {
        setTotalSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workoutComplete, isPaused]);

  // Rest countdown timer with proper cleanup and audio cue
  useEffect(() => {
    let interval = null;
    if (isResting && !isPaused && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining((r) => r - 1);
      }, 1000);
    } else if (isResting && restTimeRemaining <= 0) {
      setIsResting(false);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimeRemaining, isPaused]);

  // Handle safe exit with user confirmation (Assignment Requirement)
  const handleExit = () => {
    if (totalSeconds > 10 && !workoutComplete) {
      const confirmLeave = window.confirm(
        'Are you sure you want to exit your active workout session? Unfinished sets will not be logged.'
      );
      if (!confirmLeave) return;
    }
    navigate('/workouts');
  };

  if (!workoutPlan) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: 500, margin: '2rem auto' }}>
        <Dumbbell size={36} color="var(--accent-green)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          No Active Workout Plan Found
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Please generate a weekly training split in the Workouts section first.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/workouts')}>
          Go to Workouts
        </button>
      </div>
    );
  }

  if (!currentDayPlan || currentDayPlan.isRestDay || exercises.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', maxWidth: 500, margin: '2rem auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>😴</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Scheduled Rest & Recovery Day
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {day} is programmed for muscle rejuvenation, hydration, and light mobility.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/workouts')}>
          View Weekly Split
        </button>
      </div>
    );
  }

  const markSetDone = () => {
    const key = `${exerciseIndex}-${currentSet}`;
    setCompletedSets((prev) => ({ ...prev, [key]: true }));

    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
      setRestTimeRemaining(currentExercise?.restSeconds || 60);
      setIsResting(true);
    } else {
      if (exerciseIndex < exercises.length - 1) {
        setExerciseIndex((i) => i + 1);
        setCurrentSet(1);
        setRestTimeRemaining(currentExercise?.restSeconds || 75);
        setIsResting(true);
      } else {
        finishWorkout();
      }
    }
  };

  const finishWorkout = () => {
    setWorkoutComplete(true);
    setIsResting(false);
    const sessionData = {
      day: currentDayPlan.day,
      focus: currentDayPlan.focus,
      durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      exercisesCompleted: exercises.length,
      totalSetsLogged: Object.keys(completedSets).length + 1,
      date: new Date().toISOString(),
    };
    completeSession(sessionData);
    workoutApi.saveSession(sessionData).catch(() => {});
  };

  const nextExercise = () => {
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1);
      setCurrentSet(1);
      setIsResting(false);
    } else {
      finishWorkout();
    }
  };

  const prevExercise = () => {
    if (exerciseIndex > 0) {
      setExerciseIndex((i) => i - 1);
      setCurrentSet(1);
      setIsResting(false);
    }
  };

  const loadAlternatives = async () => {
    setReplacing(true);
    setLoadingAlts(true);
    try {
      const res = await workoutApi.refineExercise({
        exercise: currentExercise,
        reason: 'User requested alternative exercise variation',
        profile: profile || {},
      });
      if (res.data?.alternatives) {
        setAlternatives(res.data.alternatives);
      }
    } catch (e) {
      setAlternatives([
        {
          id: 'alt_auto',
          name: `Bodyweight / Dumbbell Modified ${currentExercise.name}`,
          muscleGroup: currentExercise.muscleGroup,
          category: 'Low-Impact Alternative',
          sets: currentExercise.sets,
          reps: currentExercise.reps,
          restSeconds: currentExercise.restSeconds,
          instructions: ['Perform controlled repetitions focusing on clean mind-muscle contraction.'],
          equipment: ['Bodyweight'],
        },
      ]);
    } finally {
      setLoadingAlts(false);
    }
  };

  const replaceWithAlt = (alt) => {
    exercises[exerciseIndex] = { ...currentExercise, ...alt };
    setReplacing(false);
    setAlternatives([]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Workout Completion Modal
  if (workoutComplete) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 620, margin: '2rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3.5rem 2rem' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--gradient-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-green)'
          }}>
            <Trophy size={42} color="#042f1a" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Workout Completed! 🎉
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Outstanding effort today. You've crushed the {currentDayPlan.focus} training session!
          </p>

          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <Clock size={20} color="var(--accent-blue)" style={{ margin: '0 auto 0.4rem' }} />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatTime(totalSeconds)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Duration</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <Dumbbell size={20} color="var(--accent-green)" style={{ margin: '0 auto 0.4rem' }} />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {exercises.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exercises Done</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <Flame size={20} color="var(--accent-orange)" style={{ margin: '0 auto 0.4rem' }} />
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ~{Math.round(totalSeconds * 0.12)} kcal
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Est. Burned</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/progress')}>
              View Analytics
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = Math.round(((exerciseIndex) / exercises.length) * 100);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Top Stopwatch & Navigation Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', padding: '0.75rem 1rem',
        background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)'
      }}>
        <button className="btn btn-ghost btn-sm" onClick={handleExit}>
          <ArrowLeft size={16} /> Exit Session
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.05rem' }}>
            <Clock size={16} color="var(--accent-green)" />
            <span>{formatTime(totalSeconds)}</span>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Session' : 'Pause Session'}
          >
            {isPaused ? <Play size={15} color="var(--accent-green)" /> : <Pause size={15} color="var(--accent-orange)" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Exercise <strong style={{ color: 'var(--text-primary)' }}>{exerciseIndex + 1}</strong> of {exercises.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar" style={{ marginBottom: '1.25rem', height: 6 }}>
        <div className="progress-fill" style={{ width: `${overallProgress}%`, background: 'var(--accent-green)' }} />
      </div>

      {/* Rest Countdown Banner */}
      {isResting && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))',
          border: '1.5px solid var(--accent-green)', borderRadius: 'var(--radius)',
          padding: '1.5rem', marginBottom: '1.25rem', textAlign: 'center'
        }} className="animate-fade-in">
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
            Rest & Hydration Interval
          </div>
          <div style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.25rem 0', letterSpacing: '-0.02em' }}>
            {formatTime(restTimeRemaining)}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setRestTimeRemaining((r) => r + 30)}>
              +30s Rest
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsResting(false)}>
              Skip Rest & Begin Set {currentSet}
            </button>
          </div>
        </div>
      )}

      {/* Main Exercise Card */}
      <div className="card" style={{ marginBottom: '1.25rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div className="badge badge-green" style={{ marginBottom: '0.4rem' }}>
              {currentExercise?.muscleGroup} · {currentExercise?.category}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {currentExercise?.name}
            </h1>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={loadAlternatives} title="Replace with alternative">
            <RefreshCw size={13} /> Swap Exercise
          </button>
        </div>

        {/* Set & Target Reps Breakdown */}
        <div className="grid-3" style={{
          background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 12,
          border: '1px solid var(--border-color)', marginBottom: '1.25rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT SET</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-green)' }}>
              {currentSet} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {totalSets}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TARGET REPS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-blue)' }}>
              {currentExercise?.reps || '10-12'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REST DURATION</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {currentExercise?.restSeconds || 60}s
            </div>
          </div>
        </div>

        {/* Set Progress Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Set Tracker:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Array.from({ length: totalSets }).map((_, idx) => {
              const setNum = idx + 1;
              const isDone = completedSets[`${exerciseIndex}-${setNum}`];
              const isCurrent = currentSet === setNum;
              return (
                <div
                  key={setNum}
                  style={{
                    flex: 1, minWidth: 70, padding: '0.65rem 0.5rem', textAlign: 'center',
                    borderRadius: 8,
                    background: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isDone ? 'var(--accent-green)' : isCurrent ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Set {setNum}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isDone ? 'var(--accent-green)' : 'var(--text-primary)', marginTop: 2 }}>
                    {isDone ? '✓ Done' : isCurrent ? 'Active' : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button: Mark Set Done */}
        <button
          className="btn btn-primary btn-lg"
          onClick={markSetDone}
          style={{ width: '100%', marginBottom: '1.25rem' }}
        >
          <Check size={20} /> Mark Set {currentSet} Completed
        </button>

        {/* Technique Execution Instructions */}
        {currentExercise?.instructions && currentExercise.instructions.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Biomechanical Technique:
            </div>
            <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              {currentExercise.instructions.map((step, sIdx) => (
                <li key={sIdx} style={{ marginBottom: '0.3rem' }}>{step}</li>
              ))}
            </ol>
            {currentExercise.tips && (
              <div style={{
                marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '0.78rem', color: 'var(--accent-orange)'
              }}>
                💡 <strong>Trainer Cue:</strong> {currentExercise.tips}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alternative Replacement Drawer */}
      {replacing && (
        <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Alternative Variations for {currentExercise.name}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setReplacing(false)}>Cancel</button>
          </div>

          {loadingAlts ? (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div className="spinner spinner-sm" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Finding biomechanical alternatives...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alternatives.map((alt, aIdx) => (
                <div key={aIdx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)', padding: '0.875rem', borderRadius: 10,
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{alt.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {alt.sets} sets · {alt.reps} reps · {alt.equipment?.join(', ') || 'Standard'}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => replaceWithAlt(alt)}>
                    Swap Exercise
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-ghost"
          onClick={prevExercise}
          disabled={exerciseIndex === 0}
        >
          <ArrowLeft size={16} /> Previous Exercise
        </button>

        <button
          className="btn btn-secondary"
          onClick={nextExercise}
        >
          {exerciseIndex === exercises.length - 1 ? 'Finish Session' : 'Skip Exercise'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
