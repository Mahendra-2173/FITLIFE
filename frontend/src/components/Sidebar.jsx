import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, Dumbbell, BookOpen,
  Calendar, Droplets, TrendingUp, Sparkles, User, Activity, X, LogOut,
  Flame, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const navSections = [
  {
    title: 'Core Hub',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        color: '#ef4444', // Red
        desc: 'Overview & metrics'
      },
      {
        to: '/nutrition',
        label: 'Fridge-to-Recipe',
        icon: UtensilsCrossed,
        color: '#f59e0b', // Amber Flame
        badge: 'AI CHEF',
        badgeColor: '#f59e0b',
        highlight: true,
        desc: 'Interactive chef generator'
      },
    ]
  },
  {
    title: 'Training & Gym',
    items: [
      {
        to: '/workouts',
        label: 'Workout Plans',
        icon: Dumbbell,
        color: '#f43f5e', // Crimson Red
        desc: 'Routines & AI prompts'
      },
      {
        to: '/exercise-library',
        label: 'Exercise Library',
        icon: BookOpen,
        color: '#06b6d4', // Cyan
        desc: 'Technique cues & anatomy'
      },
    ]
  },
  {
    title: 'Body & Routine',
    items: [
      {
        to: '/body-analysis',
        label: 'Body Analysis',
        icon: Activity,
        color: '#fb7185', // Coral Rose
        desc: 'BMI, BMR & macros'
      },
      {
        to: '/planner',
        label: 'Daily Timetable',
        icon: Calendar,
        color: '#10b981', // Mint Emerald
        desc: 'Hourly schedule'
      },
      {
        to: '/tracker',
        label: 'Habits & Hydration',
        icon: Droplets,
        color: '#0ea5e9', // Ocean Blue
        desc: 'Water, sleep, steps'
      },
    ]
  },
  {
    title: 'Intelligence & Settings',
    items: [
      {
        to: '/progress',
        label: 'Analytics',
        icon: TrendingUp,
        color: '#a855f7', // Violet
        desc: 'Weight trends & charts'
      },
      {
        to: '/coach',
        label: 'AI Coach',
        icon: Sparkles,
        color: '#eab308', // Gold
        desc: 'Custom action protocols'
      },
      {
        to: '/profile',
        label: 'Profile & Settings',
        icon: User,
        color: '#94a3b8', // Silver
        desc: 'Account & targets'
      },
    ]
  }
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
        {/* ─── Unique Brand Header ─── */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img
                  src="/fitlife_logo_transparent.png"
                  alt="FITLIFE Logo"
                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                />
              </div>

              <div>
                <div style={{
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  lineHeight: 1.1
                }}>
                  FITLIFE
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    background: 'rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    letterSpacing: '0.06em'
                  }}>
                    AI
                  </span>
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

        {/* ─── Unique Athlete Profile Card ─── */}
        {profile && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(18, 18, 24, 0.9) 100%)',
              borderRadius: 12,
              padding: '0.65rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #7f1d1d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)'
                }}>
                  {(profile.name || 'U')[0].toUpperCase()}
                </div>
                {/* Live Active Status Indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid #0d0d12'
                }} />
              </div>

              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profile.name || 'Athlete'}
                </div>
                <div style={{
                  fontSize: '0.66rem',
                  color: '#f87171',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {profile.goal?.replace(/_/g, ' ') || 'General Fitness'}
                </div>
              </div>

              <button
                className="btn btn-icon btn-ghost"
                onClick={handleSignOut}
                title="Sign Out / Switch Account"
                style={{
                  padding: '4px 6px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 6,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ─── Categorized Navigation with Section Accents ─── */}
        <nav style={{ padding: '0.5rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '0.75rem' }}>
              <div className="nav-section-label">
                <span style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--accent-red)'
                }} />
                {section.title}
              </div>

              {section.items.map(({ to, label, icon: Icon, color, badge, highlight }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent',
                    background: isActive ? `${color}18` : 'transparent',
                    boxShadow: isActive ? `inset 0 0 16px ${color}12` : 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className="nav-icon-box"
                        style={{
                          background: isActive ? `${color}30` : `${color}14`,
                          border: `1px solid ${isActive ? color : `${color}25`}`,
                          boxShadow: isActive ? `0 0 10px ${color}40` : 'none'
                        }}
                      >
                        <Icon size={16} color={isActive ? '#ffffff' : color} strokeWidth={isActive ? 2.5 : 2} />
                      </div>

                      <span style={{
                        flex: 1,
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.86rem'
                      }}>
                        {label}
                      </span>

                      {badge && (
                        <span style={{
                          padding: '0.12rem 0.5rem',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          borderRadius: 999,
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.45)',
                          letterSpacing: '0.04em'
                        }}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ─── Unique Footer & Quick Logout ─── */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(6, 6, 8, 0.8)'
        }}>
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
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '0.5rem',
              padding: '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: 8,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            <LogOut size={14} /> Switch / Sign Out Account
          </button>

          <div style={{
            fontSize: '0.64rem',
            color: 'rgba(255, 255, 255, 0.35)',
            textAlign: 'center',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}>
            <ShieldCheck size={11} color="#ef4444" />
            FITLIFE AI v1.0 • All systems active
          </div>
        </div>
      </aside>
    </>
  );
}
