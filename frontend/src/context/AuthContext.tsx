import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  register: (params: { name: string; email: string; company: string; role: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeUser = (u: User | null): User | null => {
  if (!u) return null;
  if (u.name.toLowerCase().includes('yasasvi') || !u.name) {
    return {
      ...u,
      name: 'Sarah Jenkins',
      role: 'Lead Merchandise Planner',
      company: 'Nordic Retail Group'
    };
  }
  return u;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => (
    localStorage.getItem('launchwise_auth_token') || 
    sessionStorage.getItem('launchwise_auth_token') || 
    localStorage.getItem('demandwise_auth_token')
  ));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('launchwise_auth_token') || 
                          sessionStorage.getItem('launchwise_auth_token') || 
                          localStorage.getItem('demandwise_auth_token');
      if (storedToken) {
        try {
          const res = await apiClient.getMe(storedToken);
          if (res.user) {
            setUser(sanitizeUser(res.user));
            setToken(storedToken);
          } else {
            localStorage.removeItem('launchwise_auth_token');
            sessionStorage.removeItem('launchwise_auth_token');
            localStorage.removeItem('demandwise_auth_token');
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing local credentials', err);
          localStorage.removeItem('launchwise_auth_token');
          sessionStorage.removeItem('launchwise_auth_token');
          localStorage.removeItem('demandwise_auth_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, password);
      if (rememberMe) {
        localStorage.setItem('launchwise_auth_token', res.token);
        localStorage.setItem('launchwise_remember_email', email);
        sessionStorage.removeItem('launchwise_auth_token');
      } else {
        sessionStorage.setItem('launchwise_auth_token', res.token);
        localStorage.removeItem('launchwise_auth_token');
        localStorage.removeItem('launchwise_remember_email');
      }
      setToken(res.token);
      setUser(sanitizeUser(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    await login('buyer@retail.com', 'demo123', true);
  };

  const register = async (params: { name: string; email: string; company: string; role: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.register(params);
      localStorage.setItem('launchwise_auth_token', res.token);
      setToken(res.token);
      setUser(sanitizeUser(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('launchwise_auth_token');
    sessionStorage.removeItem('launchwise_auth_token');
    localStorage.removeItem('demandwise_auth_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        register,
        logout
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
