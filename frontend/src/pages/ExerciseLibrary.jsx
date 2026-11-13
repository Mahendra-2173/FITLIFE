import { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { useWorkout } from '../context/WorkoutContext';
import { Search, Filter, Dumbbell, Plus, Check, ChevronDown, ChevronUp, Info } from 'lucide-react';

const EXERCISE_DATABASE = [
  // Upper Body - Chest
  { id: 'lib_1', name: 'Barbell Bench Press', muscleGroup: 'Chest', category: 'Upper Body', difficulty: 'Intermediate', equipment: ['Barbell', 'Bench'], sets: '3-4', reps: '8-10', instructions: ['Lie on bench with eyes under barbell.', 'Grip slightly wider than shoulder width.', 'Lower bar under control to mid-chest.', 'Drive bar upward until arms lock out.'], tips: 'Keep shoulder blades squeezed together throughout.' },
  { id: 'lib_2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'Upper Body', difficulty: 'Intermediate', equipment: ['Dumbbells', 'Incline Bench'], sets: '3', reps: '10-12', instructions: ['Set bench to 30-45 degree incline.', 'Press dumbbells upward over chest.', 'Lower dumbbells slowly until elbows are below chest level.'], tips: 'Targets the clavicular head (upper chest).' },
  { id: 'lib_3', name: 'Push-ups', muscleGroup: 'Chest', category: 'Upper Body', difficulty: 'Beginner', equipment: ['Bodyweight'], sets: '3', reps: '12-20', instructions: ['Set hands slightly wider than shoulders.', 'Lower body until chest is an inch off floor.', 'Push back up maintaining rigid body plank.'], tips: 'Keep core engaged to avoid arching lower back.' },

  // Upper Body - Back
  { id: 'lib_4', name: 'Bent-Over Barbell Row', muscleGroup: 'Back', category: 'Upper Body', difficulty: 'Intermediate', equipment: ['Barbell'], sets: '3-4', reps: '8-10', instructions: ['Hinge hips back with knees slightly bent.', 'Pull bar towards navel squeezing lats.', 'Lower bar under control without rounding back.'], tips: 'Do not use torso jerk momentum.' },
  { id: 'lib_5', name: 'Lat Pulldown', muscleGroup: 'Back', category: 'Upper Body', difficulty: 'Beginner', equipment: ['Cable Machine'], sets: '3', reps: '10-12', instructions: ['Grip wide bar with overhand grip.', 'Pull bar down towards upper chest while arching slightly.', 'Squeeze back muscles and return smoothly.'], tips: 'Pull through your elbows, not just your hands.' },
  { id: 'lib_6', name: 'Pull-ups', muscleGroup: 'Back', category: 'Upper Body', difficulty: 'Advanced', equipment: ['Pull-up Bar'], sets: '3', reps: '6-10', instructions: ['Hang with overhand grip wider than shoulders.', 'Pull yourself up until chin clears the bar.', 'Lower down with full arm extension.'], tips: 'Avoid swinging legs.' },

  // Upper Body - Shoulders
  { id: 'lib_7', name: 'Overhead Dumbbell Press', muscleGroup: 'Shoulders', category: 'Upper Body', difficulty: 'Intermediate', equipment: ['Dumbbells'], sets: '3', reps: '8-12', instructions: ['Hold dumbbells at ear height with palms forward.', 'Press straight up overhead until arms extend.', 'Lower back slowly to ear level.'], tips: 'Brace your abdominal wall so you do not arch your back.' },
  { id: 'lib_8', name: 'Lateral Raises', muscleGroup: 'Shoulders', category: 'Upper Body', difficulty: 'Beginner', equipment: ['Dumbbells'], sets: '3-4', reps: '12-15', instructions: ['Stand tall with weights at sides.', 'Raise arms laterally until parallel to floor with slight elbow bend.', 'Lower weights back down with control.'], tips: 'Lead with your elbows to isolate lateral delts.' },

  // Upper Body - Arms
  { id: 'lib_9', name: 'Barbell Bicep Curls', muscleGroup: 'Biceps', category: 'Upper Body', difficulty: 'Beginner', equipment: ['Barbell'], sets: '3', reps: '10-12', instructions: ['Stand tall with supinated grip shoulder width.', 'Curl bar upward toward chest while pinning elbows to ribs.', 'Lower bar under control.'], tips: 'Do not swing hips back and forth.' },
  { id: 'lib_10', name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps', category: 'Upper Body', difficulty: 'Beginner', equipment: ['Cable Machine'], sets: '3', reps: '12-15', instructions: ['Grip rope attachment at chest height.', 'Push down while flaring rope ends outward at bottom.', 'Hold contraction for 1 second before releasing.'], tips: 'Lock upper arms in place against sides.' },

  // Lower Body - Quads & Hamstrings & Glutes
  { id: 'lib_11', name: 'Barbell Back Squat', muscleGroup: 'Quadriceps', category: 'Lower Body', difficulty: 'Advanced', equipment: ['Barbell'], sets: '4', reps: '6-8', instructions: ['Rest bar across upper traps.', 'Descend by bending knees and sitting back until hips are below knees.', 'Drive upwards through mid-foot.'], tips: 'Keep chest upright and knees tracking over toes.' },
  { id: 'lib_12', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Hamstrings', category: 'Lower Body', difficulty: 'Intermediate', equipment: ['Barbell', 'Dumbbells'], sets: '3', reps: '8-10', instructions: ['Hold weights in front of thighs.', 'Push hips backward while keeping knees slightly soft and spine neutral.', 'Descend until feeling deep hamstring stretch, then drive hips forward.'], tips: 'Hinge at hips; do not round your lower spine.' },
  { id: 'lib_13', name: 'Barbell Hip Thrust', muscleGroup: 'Glutes', category: 'Lower Body', difficulty: 'Intermediate', equipment: ['Barbell', 'Bench'], sets: '3-4', reps: '10-12', instructions: ['Rest upper back against bench with bar across pelvis.', 'Plant feet flat and drive hips upward to ceiling.', 'Squeeze glutes at top lock-out for 2 seconds.'], tips: 'Tuck chin to chest to protect lumbar spine.' },
  { id: 'lib_14', name: 'Walking Lunges', muscleGroup: 'Quadriceps', category: 'Lower Body', difficulty: 'Intermediate', equipment: ['Dumbbells', 'Bodyweight'], sets: '3', reps: '10 each leg', instructions: ['Step forward and lower back knee towards floor.', 'Both knees should achieve 90-degree angles.', 'Push through front heel to step forward with opposite leg.'], tips: 'Keep torso upright throughout.' },
  { id: 'lib_15', name: 'Standing Calf Raises', muscleGroup: 'Calves', category: 'Lower Body', difficulty: 'Beginner', equipment: ['Dumbbells', 'Bodyweight'], sets: '3-4', reps: '15-20', instructions: ['Stand on edge of step with balls of feet.', 'Lower heels below step level for full stretch.', 'Rise up as high as possible on toes and hold for 1 second.'], tips: 'Full range of motion is critical for calf growth.' },

  // Core & Mobility
  { id: 'lib_16', name: 'Plank Hold', muscleGroup: 'Abs', category: 'Core', difficulty: 'Beginner', equipment: ['Bodyweight'], sets: '3', reps: '45-60s', instructions: ['Rest on forearms and toes.', 'Maintain straight line from head to heels.', 'Brace abs as if preparing for a punch.'], tips: 'Do not let hips sag or hike into the air.' },
  { id: 'lib_17', name: 'Hanging Leg Raises', muscleGroup: 'Abs', category: 'Core', difficulty: 'Advanced', equipment: ['Pull-up Bar'], sets: '3', reps: '10-12', instructions: ['Hang from bar with overhand grip.', 'Raise legs forward until parallel to floor or higher.', 'Lower slowly without swinging.'], tips: 'Engage core before initiating leg movement.' },
  { id: 'lib_18', name: 'Russian Twists', muscleGroup: 'Obliques', category: 'Core', difficulty: 'Intermediate', equipment: ['Bodyweight', 'Dumbbell'], sets: '3', reps: '20 twists', instructions: ['Sit on floor with knees bent and feet elevated.', 'Lean torso back 45 degrees.', 'Rotate torso from side to side tapping floor with hands.'], tips: 'Turn your shoulders, not just your arms.' },
  { id: 'lib_19', name: 'World\'s Greatest Stretch', muscleGroup: 'Full Body', category: 'Mobility', difficulty: 'Beginner', equipment: ['Bodyweight'], sets: '2', reps: '5 each side', instructions: ['Step forward into deep lunge with both hands inside front foot.', 'Reach inside arm upward towards ceiling with torso rotation.', 'Return and step back into downward dog.'], tips: 'Improves hip mobility, thoracic spine, and ankles.' },
  { id: 'lib_20', name: 'High-Intensity Interval Sprints', muscleGroup: 'Cardio', category: 'Cardio', difficulty: 'Intermediate', equipment: ['Treadmill', 'Bodyweight'], sets: '8-10', reps: '30s sprint / 60s rest', instructions: ['Sprint at 90-95% maximum effort for 30 seconds.', 'Recover with light walk for 60 seconds.', 'Repeat for 15-20 total minutes.'], tips: 'Spikes metabolic rate and boosts VO2 max.' },
];

const CATEGORIES = ['All', 'Upper Body', 'Lower Body', 'Core', 'Mobility', 'Cardio'];
const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques'];

export default function ExerciseLibrary() {
  const { workoutPlan } = useWorkout();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [addedNotice, setAddedNotice] = useState(null);

  const filtered = useMemo(() => {
    return EXERCISE_DATABASE.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      const matchMuscle = selectedMuscle === 'All' || ex.muscleGroup === selectedMuscle;
      const matchDiff = selectedDifficulty === 'All' || ex.difficulty === selectedDifficulty;
      return matchSearch && matchCategory && matchMuscle && matchDiff;
    });
  }, [search, selectedCategory, selectedMuscle, selectedDifficulty]);

  const handleAddExercise = (exercise) => {
    setAddedNotice(`Added "${exercise.name}" to your current session plan!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Exercise Library"
        subtitle="Explore detailed exercise techniques, muscle targeting, and execution cues"
        badge="📚 Comprehensive Library"
      />

      {addedNotice && (
        <div style={{
          background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-green)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
          color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', fontWeight: 600
        }}>
          <Check size={16} /> {addedNotice}
        </div>
      )}

      {/* Search & Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search exercise name or muscle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-input form-select"
            style={{ width: 160 }}
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <select
            className="form-input form-select"
            style={{ width: 160 }}
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
          >
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>{m} Muscles</option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`selection-pill ${selectedCategory === cat ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No exercises found matching your filter criteria.</p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.75rem' }}
              onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedMuscle('All'); setSelectedDifficulty('All'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((ex) => {
            const isExpanded = expandedId === ex.id;
            return (
              <div key={ex.id} className="card" style={{ transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'var(--accent-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Dumbbell size={20} color="var(--accent-green)" />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ex.name}</h3>
                        <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{ex.muscleGroup}</span>
                        <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)' }}>{ex.difficulty}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Equip: {ex.equipment.join(', ')} · Rec: {ex.sets} sets × {ex.reps} reps
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddExercise(ex)}
                      title="Add to Workout"
                    >
                      <Plus size={14} /> Add
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }} className="animate-fade-in">
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                      Step-by-Step Instructions:
                    </div>
                    <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      {ex.instructions.map((step, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{step}</li>
                      ))}
                    </ol>

                    {ex.tips && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 8,
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                        fontSize: '0.78rem', color: 'var(--text-secondary)'
                      }}>
                        💡 <strong>Pro Cue:</strong> {ex.tips}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
