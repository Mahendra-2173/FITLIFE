import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, Dumbbell, BookOpen,
  Calendar, Droplets, TrendingUp, Sparkles, User, Activity, X, LogOut
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/nutrition', label: 'Fridge-to-Recipe', icon: UtensilsCrossed, badge: 'AI Engine', highlight: true },
  { to: '/workouts', label: 'Workout Plans', icon: Dumbbell },
  { to: '/exercise-library', label: 'Exercise Library', icon: BookOpen },
  { to: '/body-analysis', label: 'Body Analysis', icon: Activity },
  { to: '/planner', label: 'Daily Timetable', icon: Calendar },
  { to: '/tracker', label: 'Habits & Hydration', icon: Droplets },
  { to: '/progress', label: 'Analytics', icon: TrendingUp },
  { to: '/coach', label: 'AI Coach', icon: Sparkles },
  { to: '/profile', label: 'Settings', icon: User },
];

export default function Sidebar({ isOpen, onClose }) {
  const { profile, logout } = useUser();
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out? This will allow you to create a new profile from scratch.')) {
      logout();
      if (onClose) onClose();
      navigate('/onboarding');
    }
  };

  return (
    <>
      <div className={`overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        {/* Brand Header */}
        <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--gradient-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-green)', flexShrink: 0
              }}>
                <UtensilsCrossed size={20} color="#042f1a" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  FitLife <span style={{ color: 'var(--accent-green)' }}>AI</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Smart Recipes & Fitness
                </div>
              </div>
            </div>

            <button
              className="btn btn-icon btn-ghost"
              onClick={onClose}
              style={{ display: window.innerWidth <= 1024 ? 'flex' : 'none' }}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User Card */}
        {profile && (
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10,
              padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent-green-light)',
                border: '1px solid var(--accent-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-green)', flexShrink: 0
              }}>
                {(profile.name || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.name || 'Fitness Member'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {profile.goal?.replace(/_/g, ' ') || 'General Fitness'}
                </div>
              </div>
              <button
                className="btn btn-icon btn-ghost"
                onClick={handleSignOut}
                title="Sign Out / Switch Account"
                style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
          {navItems.map(({ to, label, icon: Icon, badge, highlight }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${highlight ? 'nav-item-highlight' : ''}`}
              onClick={onClose}
              style={highlight ? { background: 'rgba(16,185,129,0.06)' } : {}}
            >
              <Icon size={17} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span className="badge badge-green" style={{ padding: '0.1rem 0.45rem', fontSize: '0.62rem' }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer info & Logout */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#f87171',
              marginBottom: '0.6rem',
              padding: '0.45rem',
              fontSize: '0.78rem'
            }}
          >
            <LogOut size={14} /> Sign Out / New Account
          </button>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Structured AI by Groq
          </div>
        </div>
      </aside>
    </>
  );
}
