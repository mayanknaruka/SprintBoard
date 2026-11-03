import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('sb_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sb_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('sb_token')));

  const persist = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem('sb_user', JSON.stringify(nextUser));
      localStorage.setItem('sb_token', nextToken);
    } else {
      localStorage.removeItem('sb_user');
      localStorage.removeItem('sb_token');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/profile');
        if (!cancelled) {
          persist(data.data.user, token);
        }
      } catch {
        if (!cancelled) persist(null, null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token, persist]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.data.user, data.data.token);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    persist(data.data.user, data.data.token);
    return data.data.user;
  };

  const logout = () => persist(null, null);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
