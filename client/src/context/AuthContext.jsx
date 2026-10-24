import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (emailOrUsername, password, rememberMe = true) => {
    try {
      const res = await api.post('/auth/login', { emailOrUsername, password, rememberMe });
      setUser(res.data.user);
      await fetchCurrentUser();
      toast.success('Welcome back!');
      return { success: true };
    } catch (err) {
      toast.error(err.message || 'Login failed');
      return { success: false, error: err };
    }
  };

  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      setUser(res.data.user);
      await fetchCurrentUser();
      toast.success('Registration successful!');
      return { success: true };
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return { success: false, error: err };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.info('Logged out successfully');
    } catch (err) {
      setUser(null);
    }
  };

  const updateUser = (updatedProfile) => {
    setUser((prev) => (prev ? { ...prev, profile: updatedProfile } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        updateUser,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
