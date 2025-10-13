import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';
import { styles } from '../assets/styles/auth-styles.js';
import { COLORS } from '../color/colors.js';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Callback params:', params);
        console.log('Platform:', Platform.OS);
        
        if (Platform.OS === 'web') {
          console.log('Running in browser - clearing cookies and redirecting to app');
          
          // ล้าง cookies ก่อน redirect กลับแอพ
          console.log('Clearing browser cookies...');
          document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
          });
          console.log('Cookies cleared, redirecting to app');
          
          const appUrl = `mobileapp://callback?${new URLSearchParams(params).toString()}`;
          console.log('App URL:', appUrl);
          
          window.location.href = appUrl;
          return;
        }
        
        const { token, user_id, email, display_name, provider } = params;
        
        if (!token) {
          setError('No token received from Google OAuth');
          setLoading(false);
          return;
        }

        await AsyncStorage.setItem('TOKEN', token);
        const userData = {
          id: user_id,
          email: email,
          display_name: display_name,
          provider: provider
        };
        
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));
        
        console.log('Google OAuth login successful:', userData);
        
        setSuccess(true);
        setLoading(false);
        
        setTimeout(() => {
          router.replace('/');
        }, 2000);
        
      } catch (err) {
        console.error('Google callback error:', err);
        setError('Failed to process Google OAuth callback');
        setLoading(false);
      }
    };

    handleCallback();
  }, [params, router]);

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