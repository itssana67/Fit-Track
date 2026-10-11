// Top navigation for the public landing page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import useAuth from '../hooks/useAuth';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#numbers', label: 'What it calculates' },
];

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Logo />

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>

        <button className="btn-icon md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-white px-5 pb-4 md:hidden">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium text-ink-soft">
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2">
            {user ? (
              <Link to="/dashboard" className="btn-primary flex-1">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex-1">Log in</Link>
                <Link to="/register" className="btn-primary flex-1">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
