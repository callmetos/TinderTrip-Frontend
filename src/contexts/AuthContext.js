import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../../color/colors';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('TOKEN');
      const userData = await AsyncStorage.getItem('USER_DATA');
      
      if (__DEV__) {
        console.log('[AuthContext] Checking auth:', {
          hasToken: !!token,
          hasUserData: !!userData,
          tokenLength: token?.length,
        });
      }
      
      if (token && userData) {
        setAuthToken(token); // Set token in API client
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        if (__DEV__) console.log('[AuthContext] User authenticated');
      } else {
        setAuthToken(null); // Clear token in API client
        setIsAuthenticated(false);
        if (__DEV__) console.log('[AuthContext] User not authenticated');
      }
    } catch (error) {
      if (__DEV__) console.error('[AuthContext] Auth check failed:', error);
      setAuthToken(null); // Clear token on error
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      if (__DEV__) {
        console.log('[AuthContext] Logging in user:', {
          hasUserData: !!userData,
          hasToken: !!token,
          tokenLength: token?.length,
        });
      }
      
      await AsyncStorage.setItem('TOKEN', token);
      await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));
      setAuthToken(token); // Set token in API client
      setUser(userData);
      setIsAuthenticated(true);
      
  if (__DEV__) console.log('[AuthContext] Login successful, navigating to /welcome');
      
      // navigate to welcome
      try {
        router.replace('/welcome');
      } catch (e) {
        if (__DEV__) console.error('[AuthContext] Navigation error:', e);
      }
    } catch (error) {
      if (__DEV__) console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('TOKEN');
      await AsyncStorage.removeItem('USER_DATA');
      setAuthToken(null); // Clear token in API client
      setUser(null);
      setIsAuthenticated(false);
      try {
        router.replace('/login');
      } catch (e) {
        // ignore
      }
    } catch (error) {
      if (__DEV__) console.error('Logout failed:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth
  };
  // Always provide the context so consumers (useAuth) don't throw.
  // When we are initializing, render a loading screen inside the provider.
  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.textLight }}>Checking authentication...</Text>
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};