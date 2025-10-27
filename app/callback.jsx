import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { styles } from '../assets/styles/auth-styles.js';
import { COLORS } from '../color/colors.js';
import { useAuth } from '../src/contexts/AuthContext';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // เช็ค AUTH_SOURCE เพื่อดูว่าเป็น mobile หรือ web
        const authSource = await AsyncStorage.getItem('AUTH_SOURCE');
        
        const { token, user_id, email, display_name, provider } = params;
        
        if (!token) {
          setError('No token received from Google OAuth');
          setLoading(false);
          return;
        }

        if (authSource === 'mobile') {
          // สำหรับ mobile - บันทึกข้อมูลและ redirect กลับไปแอพ
          await AsyncStorage.setItem('TOKEN', token);
          const userData = {
            id: user_id,
            email: email,
            display_name: display_name,
            provider: provider
          };
          await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));
          
          // ล้าง AUTH_SOURCE
          await AsyncStorage.removeItem('AUTH_SOURCE');
          
          // Redirect กลับไปแอพ
          const appUrl = `mobileapp://callback?${new URLSearchParams(params).toString()}`;
          window.location.href = appUrl;
          
        } else {
          // สำหรับ web - บันทึกข้อมูลและอัปเดต AuthContext
          const userData = {
            id: user_id,
            email: email,
            display_name: display_name,
            provider: provider
          };
          
          // ใช้ authLogin จาก context เพื่ออัปเดต state
          const loginSuccess = await authLogin(userData, token);
          
          if (loginSuccess) {
            setSuccess(true);
            setLoading(false);
            
            setTimeout(() => {
              router.replace('/');
            }, 2000);
          } else {
            setError('Failed to update authentication state');
            setLoading(false);
          }
        }
        
      } catch (err) {
        console.error('Google callback error:', err);
        setError('Failed to process Google OAuth callback');
        setLoading(false);
      }
    };

    handleCallback();
  }, [params, router, authLogin]);

  if (loading) {
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
          <Image
            source={require('../assets/images/Login-page/logo.png')}
            style={{ width: 80, height: 80, marginBottom: 20 }}
          />
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ 
            marginTop: 20, 
            fontSize: 18, 
            fontWeight: '600',
            color: COLORS.text,
            textAlign: 'center'
          }}>
            Processing Google login...
          </Text>
          <Text style={{ 
            marginTop: 8, 
            fontSize: 14, 
            color: COLORS.textLight,
            textAlign: 'center'
          }}>
            Please wait while we set up your account
          </Text>
        </View>
      </View>
    );
  }

  if (success) {
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
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#E8F5E8',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
          </View>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 8
          }}>
            Login Successful!
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: COLORS.textLight,
            textAlign: 'center',
            marginBottom: 20
          }}>
            Welcome to TinderTrip
          </Text>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={{ 
            marginTop: 8, 
            fontSize: 14, 
            color: COLORS.textLight,
            textAlign: 'center'
          }}>
            Redirecting to home...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
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
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FFE5E5',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Ionicons name="alert-circle" size={50} color={COLORS.expense} />
          </View>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 8
          }}>
            Login Failed
          </Text>
          <Text style={{ 
            color: COLORS.expense, 
            fontSize: 16, 
            textAlign: 'center',
            lineHeight: 22
          }}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}