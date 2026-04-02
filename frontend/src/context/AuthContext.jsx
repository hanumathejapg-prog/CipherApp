import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe } from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token); // Start loading if token exists

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔄 AuthContext - Loading user with token:', token.substring(0, 20) + '...');
        const me = await fetchMe(token);
        console.log('✅ AuthContext - User loaded:', me.id);
        setUser(me);
      } catch (e) {
        console.error('❌ AuthContext - Failed to fetch user:', e.response?.status, e.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      loginWithToken: (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
      },
      logout: () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
