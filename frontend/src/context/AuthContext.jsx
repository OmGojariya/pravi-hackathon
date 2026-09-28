import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('infratrack_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user details if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.data);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data?.token) {
      localStorage.setItem('infratrack_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('infratrack_token');
    setToken(null);
    setUser(null);
  };

  // Helper for quick 1-click demo role switching
  const loginDemo = async (roleType) => {
    const demoCredentials = {
      admin: { email: 'admin@infratrack.com', password: 'Admin@123' },
      assetmanager: { email: 'assetmanager@infratrack.com', password: 'Asset@123' },
      engineer: { email: 'engineer@infratrack.com', password: 'Engineer@123' },
      viewer: { email: 'viewer@infratrack.com', password: 'Viewer@123' },
    };

    const creds = demoCredentials[roleType.toLowerCase()] || demoCredentials.admin;
    return await login(creds.email, creds.password);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        loginDemo,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
