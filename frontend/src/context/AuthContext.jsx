import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profileData = await authService.getProfile();
      setUser(profileData);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('secureshare:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('secureshare:unauthorized', handleUnauthorized);
    };
  }, [fetchProfile]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role,
      is_active: true,
    });
    return data;
  };

  const register = async (formData) => {
    return await authService.register(formData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshProfile: fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
