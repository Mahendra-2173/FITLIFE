import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { NutritionProvider } from './context/NutritionContext';
import { HabitProvider } from './context/HabitContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import BodyAnalysis from './pages/BodyAnalysis';
import Workouts from './pages/Workouts';
import WorkoutSession from './pages/WorkoutSession';
import ExerciseLibrary from './pages/ExerciseLibrary';
import Nutrition from './pages/Nutrition';
import DailyPlanner from './pages/DailyPlanner';
import ActivityTracker from './pages/ActivityTracker';
import Progress from './pages/Progress';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';

import { Menu, Flame } from 'lucide-react';

function AppLayout() {
  const { isLoading, hasProfile } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <LoadingSpinner text="Starting FITLIFE AI Engine..." />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile header */}
        <header
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border-color)'
          }}
          className="mobile-header"
        >
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              overflow: 'hidden'
            }}>
              <img
                src="/fitlife_logo_transparent.png"
                alt="FITLIFE Logo"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              FITLIFE <span style={{ color: '#ef4444' }}>AI</span>
            </span>
          </div>

          <div style={{ width: 38 }} />
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/recipes" element={<Nutrition />} />
          <Route path="/body-analysis" element={<BodyAnalysis />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/workouts/session/:day" element={<WorkoutSession />} />
          <Route path="/exercise-library" element={<ExerciseLibrary />} />
          <Route path="/planner" element={<DailyPlanner />} />
          <Route path="/tracker" element={<ActivityTracker />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/coach" element={<AICoach />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UserProvider>
          <WorkoutProvider>
            <NutritionProvider>
              <HabitProvider>
                <AppLayout />
              </HabitProvider>
            </NutritionProvider>
          </WorkoutProvider>
        </UserProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
