// Shell for all logged-in pages: sidebar + top bar + page content
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar.jsx';
import Logo from '../components/Logo.jsx';
import useAuth from '../hooks/useAuth';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={handleLogout} />

      <div className="lg:pl-64">
        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <button className="btn-icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <Logo to="/dashboard" />
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-fern-50 text-sm font-bold text-fern-700">
            {user?.name?.charAt(0)?.toUpperCase()}
          </span>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
