import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '../assets/styles/auth-styles.js';
import { COLORS } from '../color/colors.js';

export default function GoogleRedirectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('Google redirect params:', params);
        
        // รอ 2 วินาที
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ล้าง cookies และ session storage
        if (typeof document !== 'undefined') {
          console.log('Clearing browser cookies and storage...');
          
          // ล้าง cookies ทั้งหมด
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
          
          // ล้าง session storage
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
          
          // ล้าง local storage
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          
          console.log('All storage cleared');
        }
        
        // ส่งไป Google OAuth
        const { auth_url } = params;
        if (auth_url) {
          console.log('Redirecting to Google OAuth:', auth_url);
          window.location.href = auth_url;
        } else {
          console.error('No auth_url provided');
          router.replace('/login');
        }
        
      } catch (error) {
        console.error('Google redirect error:', error);
        router.replace('/login');
      }
    };

    handleRedirect();
  }, [params, router]);

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }]}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ 
          marginTop: 20, 
          fontSize: 18, 
          fontWeight: '600',
          color: COLORS.text,
          textAlign: 'center'
        }}>
          Preparing Google login...
        </Text>
        <Text style={{ 
          marginTop: 8, 
          fontSize: 14, 
          color: COLORS.textLight,
          textAlign: 'center'
        }}>
          Please wait while we clear your session
        </Text>
      </View>
    </View>
  );
}
