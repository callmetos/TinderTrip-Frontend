import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../../color/colors';

export const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Debug logging
    console.log('[ProtectedRoute] Auth state:', {
      isLoading,
      requireAuth,
      isAuthenticated,
      willRedirect: (!isLoading && requireAuth && !isAuthenticated) || (!isLoading && !requireAuth && isAuthenticated)
    });
    
    // ถ้าต้องการ authentication แต่ไม่ได้ login
    if (!isLoading && requireAuth && !isAuthenticated) {
      console.log('[ProtectedRoute] Redirecting to login - not authenticated');
      setIsRedirecting(true);
      router.replace('/login');
    }
    
    // ถ้าไม่ต้องการ authentication แต่ login แล้ว
    if (!isLoading && !requireAuth && isAuthenticated) {
      console.log('[ProtectedRoute] Redirecting to welcome - already authenticated');
      setIsRedirecting(true);
      router.replace('/welcome');
    }
  }, [isLoading, requireAuth, isAuthenticated, router]);

  // แสดง loading screen ขณะตรวจสอบ authentication หรือกำลัง redirect
  if (isLoading || isRedirecting) {
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
          {isRedirecting ? 'Redirecting...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // ถ้า auth state ไม่ถูกต้อง ให้แสดง loading แทนที่จะ render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  // แสดง children component เมื่อ auth state ถูกต้อง
  return <>{children}</>;
};

export default ProtectedRoute;
