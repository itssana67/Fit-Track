import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col px-5 py-6">
      <Logo />
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-7xl font-bold text-fern-200">404</p>
        <h1 className="mt-2 text-2xl font-bold">This page does not exist</h1>
        <p className="mt-2 text-ink-soft">The link may be broken, or the page may have moved.</p>
        <div className="mt-6 flex gap-2">
          <Link to="/" className="btn-secondary">Home</Link>
          <Link to="/dashboard" className="btn-primary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
