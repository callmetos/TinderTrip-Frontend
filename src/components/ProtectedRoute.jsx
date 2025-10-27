import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../../color/colors';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // แสดง loading screen ขณะตรวจสอบ authentication
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: COLORS.background 
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ 
          marginTop: 10, 
          fontSize: 16, 
          color: COLORS.textLight 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // ถ้าต้องการ authentication แต่ไม่ได้ login
  if (requireAuth && !isAuthenticated) {
    // Redirect ไปหน้า login
    router.replace('/login');
    return null;
  }

  // ถ้าไม่ต้องการ authentication แต่ login แล้ว
  if (!requireAuth && isAuthenticated) {
    // Redirect ไปหน้า welcome หรือ home
    router.replace('/welcome');
    return null;
  }

  // แสดง children component
  return children;
};

export default ProtectedRoute;
