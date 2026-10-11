// Login and register pages are hidden from users who are already logged in
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen label="" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
