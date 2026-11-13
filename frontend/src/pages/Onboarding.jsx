import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { profileApi, bodyAnalysisApi } from '../api';
import { ChevronRight, ChevronLeft, Check, Zap, User, Target, Dumbbell, Apple } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Basic Info', subtitle: 'Tell us about yourself', icon: User },
  { id: 2, title: 'Fitness Goals', subtitle: 'What do you want to achieve?', icon: Target },
  { id: 3, title: 'Workout Setup', subtitle: 'How do you like to train?', icon: Dumbbell },
  { id: 4, title: 'Lifestyle & Diet', subtitle: 'Your daily habits', icon: Apple },
];

const GOALS = [
  { value: 'weight_loss', label: 'Weight Loss', emoji: '⚡', desc: 'Shed excess weight' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥', desc: 'Burn fat, preserve muscle' },
  { value: 'muscle_building', label: 'Muscle Building', emoji: '💪', desc: 'Build strength & size' },
  { value: 'weight_gain', label: 'Weight Gain', emoji: '📈', desc: 'Healthy mass gain' },
  { value: 'weight_maintenance', label: 'Maintenance', emoji: '⚖️', desc: 'Stay at current weight' },
  { value: 'general_fitness', label: 'General Fitness', emoji: '🏃', desc: 'Overall health & fitness' },
];

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: '< 1 year of training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years of training' },
  { value: 'advanced', label: 'Advanced', desc: '3+ years of training' },
];

const LOCATIONS = [
  { value: 'gym', label: '🏋️ Gym', desc: 'Full equipment access' },
  { value: 'home', label: '🏠 Home', desc: 'Minimal equipment' },
  { value: 'both', label: '🔄 Both', desc: 'Flexible training' },
];

const DIETS = [
  { value: 'non_vegetarian', label: '🍗 Non-Vegetarian' },
  { value: 'vegetarian', label: '🥗 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'keto', label: '🥑 Keto' },
  { value: 'other', label: '🍽️ Other' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', desc: 'Very hard exercise + physical job' },
];

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbells', 'Resistance Bands', 'Pull-up Bar', 'Bench',
  'Kettlebells', 'Cable Machine', 'Treadmill', 'No Equipment'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveProfile, saveBodyAnalysis } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', age: '', gender: 'male', height: '', weight: '', targetWeight: '',
    goal: '', experience: '', workoutLocation: '', workoutDaysPerWeek: 4,
    preferredDuration: 45, preferredWorkoutTime: 'morning', equipment: [],
    dietaryPreference: 'non_vegetarian', allergies: '', activityLevel: 'moderately_active',
    sleepDuration: 7, limitations: '',
  });

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const toggleEquipment = (item) => {
    setForm(f => ({
      ...f,
      equipment: f.equipment.includes(item) ? f.equipment.filter(e => e !== item) : [...f.equipment, item]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (step === 1) {
      if (!form.name.trim()) newErrors.name = 'Name is required';
      if (!form.age || form.age < 10 || form.age > 100) newErrors.age = 'Enter a valid age (10-100)';
      if (!form.height || form.height < 100 || form.height > 250) newErrors.height = 'Enter height in cm (100-250)';
      if (!form.weight || form.weight < 30 || form.weight > 300) newErrors.weight = 'Enter weight in kg (30-300)';
    }
    if (step === 2) {
      if (!form.goal) newErrors.goal = 'Please select a fitness goal';
      if (!form.experience) newErrors.experience = 'Please select your experience level';
    }
    if (step === 3) {
      if (!form.workoutLocation) newErrors.workoutLocation = 'Please select workout location';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validate()) setStep(s => Math.min(s + 1, 4));
  };

  const back = () => setStep(s => Math.max(s - 1, 1));

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const profileData = {
        ...form,
        age: parseInt(form.age),
        height: parseFloat(form.height),
        weight: parseFloat(form.weight),
        targetWeight: form.targetWeight ? parseFloat(form.targetWeight) : null,
        workoutDaysPerWeek: parseInt(form.workoutDaysPerWeek),
        preferredDuration: parseInt(form.preferredDuration),
        sleepDuration: parseInt(form.sleepDuration),
      };

      // Save profile to backend
      try {
        await profileApi.save(profileData);
      } catch (e) {
        console.warn('Backend save failed, using local only:', e.message);
      }

      // Calculate body analysis
      try {
        const analysis = await bodyAnalysisApi.calculate(profileData);
        if (analysis.success) saveBodyAnalysis(analysis.data);
      } catch (e) {
        console.warn('Body analysis failed:', e.message);
      }

      saveProfile(profileData);
      navigate('/');
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--gradient-green)', marginBottom: '1rem',
            boxShadow: 'var(--shadow-green)'
          }}>
            <Zap size={28} color="#042f1a" fill="#042f1a" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            Welcome to <span className="text-gradient">FitLife AI</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Smart Fridge-to-Recipe Engine & Personal Health Management
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div className={`step-dot ${step > s.id ? 'done' : step === s.id ? 'active' : 'pending'}`}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${step > s.id ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {STEPS[step - 1].title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {STEPS[step - 1].subtitle}
            </p>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your name" value={form.name}
                  onChange={e => set('name', e.target.value)} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" placeholder="25" value={form.age}
                    onChange={e => set('age', e.target.value)} min="10" max="100" />
                  {errors.age && <span className="form-error">{errors.age}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input form-select" value={form.gender}
                    onChange={e => set('gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input className="form-input" type="number" placeholder="175" value={form.height}
                    onChange={e => set('height', e.target.value)} min="100" max="250" />
                  {errors.height && <span className="form-error">{errors.height}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Current Weight (kg)</label>
                  <input className="form-input" type="number" placeholder="70" value={form.weight}
                    onChange={e => set('weight', e.target.value)} min="30" max="300" />
                  {errors.weight && <span className="form-error">{errors.weight}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Weight (kg) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Optional</span></label>
                <input className="form-input" type="number" placeholder="65" value={form.targetWeight}
                  onChange={e => set('targetWeight', e.target.value)} min="30" max="300" />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Primary Fitness Goal</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {GOALS.map(g => (
                    <button key={g.value}
                      onClick={() => set('goal', g.value)}
                      style={{
                        background: form.goal === g.value ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${form.goal === g.value ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        borderRadius: 10, padding: '0.875rem', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit'
                      }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{g.emoji}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{g.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.desc}</div>
                    </button>
                  ))}
                </div>
                {errors.goal && <span className="form-error" style={{ marginTop: '0.5rem' }}>{errors.goal}</span>}
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Experience Level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {EXPERIENCE.map(e => (
                    <button key={e.value} onClick={() => set('experience', e.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: form.experience === e.value ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                        border: `1px solid ${form.experience === e.value ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        borderRadius: 10, padding: '0.75rem 1rem', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit', width: '100%'
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${form.experience === e.value ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {form.experience === e.value && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-green)' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{e.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.experience && <span className="form-error">{errors.experience}</span>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Workout Location</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {LOCATIONS.map(l => (
                    <button key={l.value} onClick={() => set('workoutLocation', l.value)}
                      style={{
                        background: form.workoutLocation === l.value ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${form.workoutLocation === l.value ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        borderRadius: 10, padding: '0.875rem 0.5rem', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.2s', fontFamily: 'inherit'
                      }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{l.label.split(' ')[0]}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{l.label.split(' ').slice(1).join(' ')}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{l.desc}</div>
                    </button>
                  ))}
                </div>
                {errors.workoutLocation && <span className="form-error">{errors.workoutLocation}</span>}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Days per Week</label>
                  <input className="form-input" type="number" value={form.workoutDaysPerWeek}
                    onChange={e => set('workoutDaysPerWeek', e.target.value)} min="2" max="6" />
                </div>
                <div className="form-group">
                  <label className="form-label">Session Duration (min)</label>
                  <input className="form-input" type="number" value={form.preferredDuration}
                    onChange={e => set('preferredDuration', e.target.value)} min="20" max="120" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Workout Time</label>
                <select className="form-input form-select" value={form.preferredWorkoutTime}
                  onChange={e => set('preferredWorkoutTime', e.target.value)}>
                  <option value="early_morning">Early Morning (5-7 AM)</option>
                  <option value="morning">Morning (7-9 AM)</option>
                  <option value="afternoon">Afternoon (12-2 PM)</option>
                  <option value="evening">Evening (5-7 PM)</option>
                  <option value="night">Night (7-10 PM)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Available Equipment</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {EQUIPMENT_OPTIONS.map(item => (
                    <button key={item}
                      className={`selection-pill ${form.equipment.includes(item) ? 'selected' : ''}`}
                      onClick={() => toggleEquipment(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Injuries or Limitations <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Optional</span></label>
                <textarea className="form-input" rows={2} placeholder="e.g., Lower back pain, knee injury..."
                  value={form.limitations} onChange={e => set('limitations', e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Dietary Preference</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DIETS.map(d => (
                    <button key={d.value}
                      className={`selection-pill ${form.dietaryPreference === d.value ? 'selected' : ''}`}
                      onClick={() => set('dietaryPreference', d.value)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Food Allergies / Restrictions <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Optional</span></label>
                <input className="form-input" placeholder="e.g., Lactose intolerant, no nuts..."
                  value={form.allergies} onChange={e => set('allergies', e.target.value)} />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Daily Activity Level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ACTIVITY_LEVELS.map(a => (
                    <button key={a.value} onClick={() => set('activityLevel', a.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: form.activityLevel === a.value ? 'rgba(139,92,246,0.1)' : 'transparent',
                        border: `1px solid ${form.activityLevel === a.value ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                        borderRadius: 10, padding: '0.625rem 1rem', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit', width: '100%'
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${form.activityLevel === a.value ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {form.activityLevel === a.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)' }} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Average Sleep Duration: <strong style={{ color: 'var(--accent-purple)' }}>{form.sleepDuration} hrs</strong></label>
                <input type="range" min="4" max="12" step="0.5" value={form.sleepDuration}
                  onChange={e => set('sleepDuration', parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>4 hrs</span><span>12 hrs</span>
                </div>
              </div>

              {errors.submit && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'center' }}>
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            <button className="btn btn-ghost" onClick={back} disabled={step === 1}>
              <ChevronLeft size={16} /> Back
            </button>

            {step < 4 ? (
              <button className="btn btn-primary" onClick={next}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading}>
                {loading ? (
                  <><div className="spinner spinner-sm" /> Setting up your profile...</>
                ) : (
                  <><Zap size={16} /> Start Your Journey</>
                )}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Step {step} of {STEPS.length} · Your data is stored locally
        </p>
      </div>
    </div>
  );
}
