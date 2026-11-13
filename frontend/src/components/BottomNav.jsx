import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, Calendar, User } from 'lucide-react';

const mobileItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard, color: '#ef4444' },
  { to: '/nutrition', label: 'Recipes', icon: UtensilsCrossed, color: '#f59e0b' },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell, color: '#f43f5e' },
  { to: '/planner', label: 'Planner', icon: Calendar, color: '#10b981' },
  { to: '/profile', label: 'Profile', icon: User, color: '#94a3b8' },
];

export default function BottomNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {mobileItems.map(({ to, label, icon: Icon, color }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            color: isActive ? color : 'var(--text-muted)'
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{
                padding: '3px',
                borderRadius: '8px',
                background: isActive ? `${color}25` : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}>
                <Icon size={19} color={isActive ? color : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.68rem' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
