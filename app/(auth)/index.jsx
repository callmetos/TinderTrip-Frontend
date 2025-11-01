import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from "react-native";
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';

// Constants
const STORAGE_KEYS = {
  TOKEN: 'TOKEN',
  USER_DATA: 'USER_DATA'
};

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check for token
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (token) {
        // Has JWT token - go to welcome
        console.log('Token found, redirecting to home');
        router.replace('/home');
      } else {
        // No JWT token - go to login
        console.log('No token found, redirecting to login');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // On error, redirect to login for safety
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={{ fontSize: 18, color: COLORS.textLight, marginTop: 10 }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Return null while navigating
  return null;
}