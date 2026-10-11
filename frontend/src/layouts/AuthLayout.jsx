import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

// Split screen: form on the left, a short product note on the right (desktop only)
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,440px)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-fern-700 p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <svg className="absolute -right-24 top-10 h-[420px] w-[420px] text-fern-600" viewBox="0 0 200 200" aria-hidden="true">
          <path d="M20 120h35l18-55 26 80 20-45h61" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative">
          <p className="font-display text-3xl font-bold leading-tight">Small sessions, logged every week, add up.</p>
          <p className="mt-3 text-fern-100">
            FitTrack keeps your workouts, meals and measurements together, so you can see what is working.
          </p>
        </div>
      </aside>
    </div>
  );
}
