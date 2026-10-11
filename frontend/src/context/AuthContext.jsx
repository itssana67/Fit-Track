// Holds the logged-in user for the whole app.
// On page load it asks the backend "who am I?" (GET /api/auth/me). The browser
// sends the httpOnly cookie automatically, so we never store the JWT in JS.
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/fittrackApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // BMI, BMR, calorie target ...
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((result) => {
    setUser(result?.user || null);
    setProfile(result?.profile || null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      applySession(await authApi.me());
    } catch {
      applySession(null);
    }
  }, [applySession]);

  // Check the session once when the app starts
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // api.js fires this event when the backend says the token is no longer valid
  useEffect(() => {
    const handleUnauthorized = () => applySession(null);
    window.addEventListener('fittrack:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('fittrack:unauthorized', handleUnauthorized);
  }, [applySession]);

  const login = useCallback(
    async (credentials) => {
      const result = await authApi.login(credentials);
      applySession(result);
      return result;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const result = await authApi.register(payload);
      applySession(result);
      return result;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const value = useMemo(
    () => ({ user, profile, loading, login, register, logout, refreshUser, applySession }),
    [user, profile, loading, login, register, logout, refreshUser, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
