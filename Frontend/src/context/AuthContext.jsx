import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uk_finance_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('uk_finance_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('uk_finance_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('uk_finance_token', newToken);
    localStorage.setItem('uk_finance_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('uk_finance_token');
    localStorage.removeItem('uk_finance_user');
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    isEmployee: user?.role === 'EMPLOYEE',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
