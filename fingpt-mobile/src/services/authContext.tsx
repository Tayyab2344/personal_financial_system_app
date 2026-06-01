import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (token && storedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
        // Verify token and fetch latest user info in background
        api.get('/auth/me')
          .then(updatedUser => {
            setUser(updatedUser);
            AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
          })
          .catch((err) => {
            console.log('Token verification failed, keeping cached profile', err.message);
          });
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userProfile: any) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
    setUser(userProfile);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_profile');
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await api.get('/auth/me');
      setUser(updatedUser);
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, refreshUser }}>
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
