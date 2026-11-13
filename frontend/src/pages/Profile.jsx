import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { bodyAnalysisApi } from '../api';
import PageHeader from '../components/PageHeader';
import {
  User, Save, RotateCcw, Check, Scale, Target, Activity, Clock,
  AlertCircle, LogOut, ShieldAlert
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, saveProfile, saveBodyAnalysis, logout } = useUser();

  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || 25,
    gender: profile?.gender || 'male',
    height: profile?.height || 175,
    weight: profile?.weight || 70,
    targetWeight: profile?.targetWeight || '',
    goal: profile?.goal || 'general_fitness',
    experience: profile?.experience || 'beginner',
    workoutLocation: profile?.workoutLocation || 'gym',
    workoutDaysPerWeek: profile?.workoutDaysPerWeek || 4,
    preferredDuration: profile?.preferredDuration || 45,
    activityLevel: profile?.activityLevel || 'moderately_active',
    dietaryPreference: profile?.dietaryPreference || 'non_vegetarian',
    allergies: profile?.allergies || '',
    sleepDuration: profile?.sleepDuration || 7.5,
    preferredWorkoutTime: profile?.preferredWorkoutTime || 'morning',
    limitations: profile?.limitations || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setSavedSuccess(false);
    setErrorNotice(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorNotice(null);
    setLoading(true);

    try {
      const ageVal = parseInt(form.age, 10);
      const heightVal = parseFloat(form.height);
      const weightVal = parseFloat(form.weight);
      const targetWeightVal = form.targetWeight ? parseFloat(form.targetWeight) : null;

      if (isNaN(ageVal) || ageVal < 10 || ageVal > 110) {
        setErrorNotice('Please enter a valid age between 10 and 110.');
        setLoading(false);
        return;
      }
      if (isNaN(heightVal) || heightVal < 80 || heightVal > 250) {
        setErrorNotice('Please enter a valid height between 80 cm and 250 cm.');
        setLoading(false);
        return;
      }
      if (isNaN(weightVal) || weightVal < 20 || weightVal > 350) {
        setErrorNotice('Please enter a valid weight between 20 kg and 350 kg.');
        setLoading(false);
        return;
      }

      const updated = {
        ...form,
        age: ageVal,
        height: heightVal,
        weight: weightVal,
        targetWeight: targetWeightVal,
        workoutDaysPerWeek: parseInt(form.workoutDaysPerWeek, 10) || 4,
        preferredDuration: parseInt(form.preferredDuration, 10) || 45,
        sleepDuration: parseFloat(form.sleepDuration) || 7.5,
      };

      saveProfile(updated);

      // Recompute body analysis in background
      try {
        const res = await bodyAnalysisApi.calculate(updated);
        if (res.success && res.data) {
          saveBodyAnalysis(res.data);
        }
      } catch (err) {
        console.warn('Re-analysis notice:', err);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    const confirmed = window.confirm(
      'Sign out and create a new account? This will clear current session data and return to Onboarding.'
    );
    if (confirmed) {
      logout();
      navigate('/onboarding');
    }
  };

  const handleResetData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all fitness data, clear localStorage, and return to onboarding?'
    );
    if (confirmed) {
      logout();
      navigate('/onboarding');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840, margin: '0 auto' }}>
      <PageHeader
        title="Settings & Fitness Profile"
        subtitle="Manage your personal physical measurements, nutritional targets, and application preferences"
        badge="⚙️ Profile Settings"
      />

      {savedSuccess && (
        <div style={{
          background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-green)',
          borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem',
          color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.88rem', fontWeight: 600
        }}>
          <Check size={18} /> Profile information and body analysis synchronized successfully!
        </div>
      )}

      {errorNotice && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid var(--accent-red)',
          borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem',
          color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={16} /> {errorNotice}
        </div>
      )}

      <form onSubmit={handleSave} className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        {/* Section 1: Body Metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={18} color="var(--accent-green)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Personal Measurements
          </h2>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-input"
              value={form.age}
              onChange={(e) => handleChange('age', e.target.value)}
              min="10"
              max="110"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Biological Gender</label>
            <select
              className="form-input form-select"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              type="number"
              step="0.5"
              className="form-input"
              value={form.height}
              onChange={(e) => handleChange('height', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={form.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={form.targetWeight}
              onChange={(e) => handleChange('targetWeight', e.target.value)}
              placeholder="e.g. 68"
            />
          </div>
        </div>

        {/* Section 2: Goals & Activity */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)'
        }}>
          <Target size={18} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Fitness Goals & Training Split
          </h2>
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Primary Fitness Goal</label>
            <select
              className="form-input form-select"
              value={form.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="fat_loss">Fat Loss</option>
              <option value="muscle_building">Muscle Building / Hypertrophy</option>
              <option value="weight_gain">Healthy Weight Gain</option>
              <option value="weight_maintenance">Maintenance & Longevity</option>
              <option value="general_fitness">General Cardiovascular Fitness</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Daily Activity Level</label>
            <select
              className="form-input form-select"
              value={form.activityLevel}
              onChange={(e) => handleChange('activityLevel', e.target.value)}
            >
              <option value="sedentary">Sedentary (desk job, low movement)</option>
              <option value="lightly_active">Lightly Active (1-3 light walks/wk)</option>
              <option value="moderately_active">Moderately Active (3-5 workouts/wk)</option>
              <option value="very_active">Very Active (6-7 intense workouts/wk)</option>
              <option value="extremely_active">Extremely Active (physical job & double sessions)</option>
            </select>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
          <div className="form-group">
            <label className="form-label">Experience</label>
            <select
              className="form-input form-select"
              value={form.experience}
              onChange={(e) => handleChange('experience', e.target.value)}
            >
              <option value="beginner">Beginner (&lt;1 year)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3+ years)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Workout Days / Week</label>
            <input
              type="number"
              min="2"
              max="7"
              className="form-input"
              value={form.workoutDaysPerWeek}
              onChange={(e) => handleChange('workoutDaysPerWeek', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Session Duration (min)</label>
            <input
              type="number"
              min="20"
              max="120"
              className="form-input"
              value={form.preferredDuration}
              onChange={(e) => handleChange('preferredDuration', e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Nutrition & Lifestyle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginBottom: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)'
        }}>
          <Activity size={18} color="var(--accent-blue)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Nutrition & Lifestyle Preferences
          </h2>
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Dietary Preference</label>
            <select
              className="form-input form-select"
              value={form.dietaryPreference}
              onChange={(e) => handleChange('dietaryPreference', e.target.value)}
            >
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="keto">Ketogenic</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Food Allergies / Dislikes</label>
            <input
              className="form-input"
              value={form.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="e.g. Peanuts, lactose, shellfish"
            />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Target Sleep (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="12"
              className="form-input"
              value={form.sleepDuration}
              onChange={(e) => handleChange('sleepDuration', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Training Time</label>
            <select
              className="form-input form-select"
              value={form.preferredWorkoutTime}
              onChange={(e) => handleChange('preferredWorkoutTime', e.target.value)}
            >
              <option value="morning">Morning (6:00 AM - 9:00 AM)</option>
              <option value="afternoon">Afternoon (12:00 PM - 2:00 PM)</option>
              <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
              <option value="night">Night (8:00 PM+)</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Injuries or Physical Exercise Limitations</label>
          <textarea
            className="form-input"
            rows={2}
            value={form.limitations}
            onChange={(e) => handleChange('limitations', e.target.value)}
            placeholder="e.g. Mild knee soreness during heavy impact; avoid jump squats"
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handleSignOut}
            >
              <LogOut size={14} /> Sign Out / New Account
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={handleResetData}
            >
              <RotateCcw size={14} /> Reset Data
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
