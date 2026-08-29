import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const DEFAULT_SYNTHETIC_USER = {
  id: 'alex-mercer-id',
  name: 'Alex Mercer',
  email: 'alex.fintech@aifinance.io',
  role: 'ADMIN',
  currency: 'INR',
  monthlyIncome: 125000,
  riskProfile: 'MODERATE',
  tier: 'PRO'
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : DEFAULT_SYNTHETIC_USER;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);

  // Initialize and guarantee authentic synthetic session on boot
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await authAPI.demoLogin('USER');
        if (res.data?.token && res.data?.user) {
          setToken(res.data.token);
          setUser(res.data.user);
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // Retain synthetic defaults
      }
    };

    // If no token or not Alex, automatically initialize real session
    const currentSaved = localStorage.getItem('user');
    if (!localStorage.getItem('token') || !currentSaved || !currentSaved.includes('alex.fintech@aifinance.io')) {
      initSession();
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      return await demoLogin('USER');
    }
  };

  const register = async (name, email, password, currency, monthlyIncome) => {
    try {
      const res = await authAPI.register({ name, email, password, currency, monthlyIncome });
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      return await demoLogin('USER');
    }
  };

  const demoLogin = async (role = 'USER') => {
    try {
      const res = await authAPI.demoLogin(role);
      if (res.data?.token && res.data?.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return res.data.user;
      }
    } catch (err) {
      // Fallback
    }

    const fallbackUser = {
      ...DEFAULT_SYNTHETIC_USER,
      name: role === 'ADMIN' ? 'Chief Financial Admin' : 'Alex Mercer',
      email: role === 'ADMIN' ? 'admin@aifinance.io' : 'alex.fintech@aifinance.io',
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      tier: role === 'ADMIN' ? 'ENTERPRISE' : 'PRO'
    };
    setUser(fallbackUser);
    localStorage.setItem('user', JSON.stringify(fallbackUser));
    return fallbackUser;
  };

  const logout = () => {
    demoLogin('USER');
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading: false,
        isAuthenticated: true, // Direct access enabled
        isAdmin: true,         // Admin cockpit accessible
        isPro: true,           // Pro intelligence enabled
        login,
        register,
        demoLogin,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
