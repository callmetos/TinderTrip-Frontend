import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { bootstrapToken, getSetupStatus } from '../api/auth.service';

const AuthContext = createContext();

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
  const [setupStep, setSetupStep] = useState('pending'); // 'pending', 'completed'

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // ตรวจสอบ token จาก AsyncStorage
      const token = await AsyncStorage.getItem('TOKEN');
      
      if (token) {
        // มี token ให้ bootstrap และตั้งค่า auth state
        await bootstrapToken();
        
        // ดึงข้อมูล user จาก AsyncStorage
        const userData = await AsyncStorage.getItem('USER_DATA');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        // ดึงข้อมูล setupStep จาก AsyncStorage (fallback)
        const savedSetupStep = await AsyncStorage.getItem('SETUP_STEP');
        
        // เช็คสถานะจาก local storage ก่อน
        if (savedSetupStep) {
          // มีข้อมูลใน local storage ให้ใช้ข้อมูลนั้นก่อน
          setSetupStep(savedSetupStep);
          console.log('Using setup status from local storage:', savedSetupStep);
          
          // ถ้า status ยังเป็น 'pending' ให้ยิง API เพื่อเช็คความชัวร์
          if (savedSetupStep === 'pending') {
            // TODO: รอ backend สร้าง API endpoint /api/v1/user/setup-status
            try {
              const response = await getSetupStatus();
              const serverSetupStep = response.data?.setup_completed ? 'completed' : 'pending';
              
              // ถ้า server บอกว่าเสร็จแล้ว ให้อัปเดต
              if (serverSetupStep === 'completed' && savedSetupStep === 'pending') {
                setSetupStep(serverSetupStep);
                await AsyncStorage.setItem('SETUP_STEP', serverSetupStep);
                console.log('Setup status updated from server:', serverSetupStep);
              }
            } catch (apiError) {
              console.log('Error fetching setup status from server:', apiError);
              // ถ้า API error ให้ใช้ข้อมูลจาก local storage
            }
          }
        } else {
          // ไม่มีข้อมูลใน local storage ให้ยิง API ไปถาม server
          // TODO: รอ backend สร้าง API endpoint /api/v1/user/setup-status
          try {
            const response = await getSetupStatus();
            const serverSetupStep = response.data?.setup_completed ? 'completed' : 'pending';
            
            // อัปเดต setupStep จาก server
            setSetupStep(serverSetupStep);
            
            // บันทึกลง AsyncStorage เพื่อใช้ครั้งต่อไป
            await AsyncStorage.setItem('SETUP_STEP', serverSetupStep);
            
            console.log('Setup status from server:', serverSetupStep);
          } catch (apiError) {
            console.log('Error fetching setup status from server:', apiError);
            // ถ้า API error ให้ใช้ค่า default
            setSetupStep('pending');
          }
        }
        
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setSetupStep('pending');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      // เก็บข้อมูลลง AsyncStorage
      await AsyncStorage.setItem('TOKEN', token);
      await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));
      
      // Bootstrap token สำหรับ API calls
      await bootstrapToken();
      
      // อัปเดต state
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // ลบข้อมูลจาก AsyncStorage
      await AsyncStorage.removeItem('TOKEN');
      await AsyncStorage.removeItem('USER_DATA');
      await AsyncStorage.removeItem('SETUP_STEP');
      
      // รีเซ็ต state
      setUser(null);
      setIsAuthenticated(false);
      setSetupStep('pending');
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  const completeSetup = async () => {
    try {
      // บันทึก setupStep เป็น 'completed' ใน AsyncStorage
      await AsyncStorage.setItem('SETUP_STEP', 'completed');
      
      // อัปเดต state
      setSetupStep('completed');
      
      return true;
    } catch (error) {
      console.error('Error completing setup:', error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    setupStep,
    login,
    logout,
    completeSetup,
    initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
