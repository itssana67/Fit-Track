// Navigation for the logged-in area. On mobile it slides in as a drawer.
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, Apple, LineChart, Target, BookOpen,
  Calculator, Sparkles, Trophy, UserRound, LogOut, X,
} from 'lucide-react';
import Logo from './Logo.jsx';

export const NAV_SECTIONS = [
  {
    title: 'Track',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/workouts', label: 'Workouts', icon: Dumbbell },
      { to: '/nutrition', label: 'Nutrition', icon: Apple },
      { to: '/progress', label: 'Progress', icon: LineChart },
      { to: '/goals', label: 'Goals', icon: Target },
    ],
  },
  {
    title: 'Explore',
    items: [
      { to: '/exercises', label: 'Exercise library', icon: BookOpen },
      { to: '/calculator', label: 'Calculator', icon: Calculator },
      { to: '/recommendations', label: 'For you', icon: Sparkles },
      { to: '/achievements', label: 'Achievements', icon: Trophy },
    ],
  },
];

export default function Sidebar({ open, onClose, user, onLogout }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-fern-50 text-fern-700' : 'text-ink-soft hover:bg-mist hover:text-ink'
    }`;

  return (
    <>
      {/* Dark overlay behind the drawer on small screens */}
      <div
        className={`fixed inset-0 z-40 bg-ink/30 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo to="/dashboard" />
          <button className="btn-icon lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-xs font-semibold text-ink-faint">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <UserRound size={18} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{user?.name}</span>
              <span className="block truncate text-xs font-normal text-ink-faint">{user?.email}</span>
            </span>
          </NavLink>
          <button onClick={onLogout} className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-rose-50 hover:text-rose-600">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
