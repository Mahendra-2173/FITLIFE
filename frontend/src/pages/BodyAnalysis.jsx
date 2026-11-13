import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { bodyAnalysisApi } from '../api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import ProgressRing from '../components/ProgressRing';
import { RefreshCw, Info, Scale, Flame, Droplets, Target, Edit3, Check, AlertCircle } from 'lucide-react';

export default function BodyAnalysis() {
  const { profile, bodyAnalysis, saveBodyAnalysis, saveProfile, addWeightLog } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(bodyAnalysis);

  // Inline measurement adjustment state
  const [isEditing, setIsEditing] = useState(false);
  const [measureForm, setMeasureForm] = useState({
    weight: profile?.weight || '',
    height: profile?.height || '',
    age: profile?.age || '',
    gender: profile?.gender || 'male',
    targetWeight: profile?.targetWeight || '',
  });
  const [formValidationMsg, setFormValidationMsg] = useState(null);
  const [updateNotice, setUpdateNotice] = useState(null);

  const calculate = async (profileData = profile) => {
    if (!profileData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bodyAnalysisApi.calculate(profileData);
      if (res.success && res.data) {
        setData(res.data);
        saveBodyAnalysis(res.data);
      } else {
        throw new Error(res.error || 'Failed to calculate metrics');
      }
    } catch (err) {
      setError(err.message || 'Error computing body metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data && profile) {
      calculate(profile);
    }
  }, []);

  const handleUpdateMeasurements = async (e) => {
    e.preventDefault();
    setFormValidationMsg(null);

    const w = parseFloat(measureForm.weight);
    const h = parseFloat(measureForm.height);
    const a = parseInt(measureForm.age, 10);
    const tw = measureForm.targetWeight ? parseFloat(measureForm.targetWeight) : null;

    if (isNaN(w) || w < 25 || w > 300) {
      setFormValidationMsg('Please enter a valid weight between 25 kg and 300 kg.');
      return;
    }
    if (isNaN(h) || h < 90 || h > 250) {
      setFormValidationMsg('Please enter a valid height between 90 cm and 250 cm.');
      return;
    }
    if (isNaN(a) || a < 12 || a > 110) {
      setFormValidationMsg('Please enter a valid age between 12 and 110.');
      return;
    }

    const updatedProfile = {
      ...(profile || {}),
      weight: w,
      height: h,
      age: a,
      gender: measureForm.gender,
      targetWeight: tw,
    };

    saveProfile(updatedProfile);
    setIsEditing(false);
    setUpdateNotice('Body measurements updated and synced across FITLIFE!');
    setTimeout(() => setUpdateNotice(null), 3000);

    // Recalculate with updated inputs
    calculate(updatedProfile);
  };

  const getBMIWidth = (bmi) => {
    // Map BMI 10-40 to 0-100%
    return Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
      <PageHeader
        title="Body Analysis & Metabolic Engine"
        subtitle="Empirical body composition, energy expenditure, and healthy macronutrient distributions"
        badge="📊 Body Analysis"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 size={14} /> {isEditing ? 'Close Editor' : 'Edit Measurements'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => calculate()} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Recalculate
            </button>
          </div>
        }
      />

      {updateNotice && (
        <div style={{
          background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-green)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
          color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', fontWeight: 600
        }}>
          <Check size={16} /> {updateNotice}
        </div>
      )}

      {/* Inline Measurement Quick-Editor */}
      {isEditing && (
        <div className="card" style={{
          marginBottom: '1.5rem', padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(15,23,42,0.9))',
          border: '1px solid rgba(16,185,129,0.3)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
            Adjust Body Measurements
          </h3>

          {formValidationMsg && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid var(--accent-red)',
              borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '1rem',
              color: 'var(--accent-red)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <AlertCircle size={14} /> {formValidationMsg}
            </div>
          )}

          <form onSubmit={handleUpdateMeasurements}>
            <div className="grid-4" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input form-input-sm"
                  value={measureForm.weight}
                  onChange={(e) => setMeasureForm({ ...measureForm, weight: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Height (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input form-input-sm"
                  value={measureForm.height}
                  onChange={(e) => setMeasureForm({ ...measureForm, height: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Age</label>
                <input
                  type="number"
                  className="form-input form-input-sm"
                  value={measureForm.age}
                  onChange={(e) => setMeasureForm({ ...measureForm, age: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input form-input-sm"
                  placeholder="Optional"
                  value={measureForm.targetWeight}
                  onChange={(e) => setMeasureForm({ ...measureForm, targetWeight: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save & Recalculate
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <LoadingSpinner text="Computing Mifflin-St Jeor metabolic expenditure..." />}
      {error && <ErrorState message={error} onRetry={() => calculate()} />}

      {data && !loading && (
        <>
          {/* BMI Card */}
          <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(56, 189, 248, 0.04))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <ProgressRing
                value={data.bmi}
                max={40}
                size={130}
                strokeWidth={12}
                color={data.bmiColor}
                label={data.bmi}
                sublabel="BMI"
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: data.bmiColor }}>{data.bmiCategory}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{data.bmiDescription}</div>
                </div>

                {/* BMI Scale */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ position: 'relative', height: 8, background: 'linear-gradient(to right, #38bdf8 25%, #10b981 25% 50%, #f59e0b 50% 75%, #ef4444 75%)', borderRadius: 999, marginBottom: '0.5rem' }}>
                    <div style={{
                      position: 'absolute',
                      left: `${getBMIWidth(data.bmi)}%`,
                      top: '50%', transform: 'translate(-50%, -50%)',
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'white', border: `3px solid ${data.bmiColor}`,
                      transition: 'left 0.5s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>Underweight (&lt;18.5)</span><span>Normal (18.5-24.9)</span><span>Overweight (25-29.9)</span><span>Obese (30+)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Weight</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{data.currentWeight} kg</div>
                  </div>
                  {data.targetWeight && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Weight</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{data.targetWeight} kg</div>
                    </div>
                  )}
                  {data.weightDifference !== null && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Difference</div>
                      <div style={{ fontWeight: 700, color: data.weightDifference < 0 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                        {data.weightDifference > 0 ? '+' : ''}{data.weightDifference} kg
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Healthy Range</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                      {data.healthyWeightRange?.min}–{data.healthyWeightRange?.max} kg
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '1.25rem', padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)'
            }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{data.disclaimer}</span>
            </div>
          </div>

          {/* Calorie & Macros */}
          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="var(--accent-orange)" /> Energy Expenditure
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'BMR (Basal Metabolic Rate)', value: `${data.bmr} kcal`, desc: 'Calories burned at complete physiological rest (Mifflin-St Jeor)', color: 'var(--accent-purple)' },
                  { label: 'TDEE (Total Daily Expenditure)', value: `${data.tdee} kcal`, desc: 'Calories burned including daily movement & training', color: 'var(--accent-blue)' },
                  { label: 'Calculated Calorie Target', value: `${data.calorieTarget} kcal`, desc: data.calorieAdjustment, color: 'var(--accent-green)', highlight: true },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: '0.875rem',
                    background: item.highlight ? `${item.color}12` : 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: item.highlight ? `1px solid ${item.color}30` : '1px solid transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.desc}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: item.color, fontSize: '0.95rem', flexShrink: 0 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="section-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--accent-purple)" /> Daily Macronutrient Split
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Protein', value: data.macros?.protein, unit: 'g', pct: 30, color: '#3b82f6', desc: 'Muscle synthesis & repair' },
                  { label: 'Carbohydrates', value: data.macros?.carbs, unit: 'g', pct: 45, color: '#f59e0b', desc: 'Sustained muscular glycogen' },
                  { label: 'Healthy Fats', value: data.macros?.fat, unit: 'g', pct: 25, color: '#10b981', desc: 'Hormonal equilibrium & joint health' },
                ].map((macro) => (
                  <div key={macro.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{macro.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{macro.desc}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: macro.color }}>
                        {macro.value}{macro.unit}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${macro.pct}%`, background: macro.color }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{macro.pct}% of total daily calories</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Water & Additional Target */}
          <div className="grid-2">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={24} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{data.waterTargetLitres}L</div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Daily Hydration Target</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimated for weight & metabolic activity</div>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scale size={24} color="var(--accent-purple)" />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                  {data.healthyWeightRange?.min}–{data.healthyWeightRange?.max} kg
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Healthy Weight Window</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standard BMI 18.5–24.9 for your height</div>
              </div>
            </div>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📊</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No body analysis computed yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Click calculate to evaluate your BMI, BMR, TDEE, and macronutrient requirements.
          </p>
          <button className="btn btn-primary" onClick={() => calculate()}>Calculate Now</button>
        </div>
      )}
    </div>
  );
}
