import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, Calendar, User } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/nutrition"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <UtensilsCrossed size={20} />
        <span>Recipes</span>
      </NavLink>

      <NavLink
        to="/workouts"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <Dumbbell size={20} />
        <span>Workouts</span>
      </NavLink>

      <NavLink
        to="/planner"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <Calendar size={20} />
        <span>Planner</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
