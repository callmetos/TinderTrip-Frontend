import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Text, View } from "react-native";
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const token = await AsyncStorage.getItem('TOKEN');
      
      if (token) {
        // มี JWT token ให้ไปหน้า welcome
        console.log('Token found, redirecting to welcome');
        router.replace('/welcome');
      } else {
        // ไม่มี JWT token ให้ไปหน้า login
        console.log('No token found, redirecting to login');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // ถ้าเกิด error ให้ไปหน้า login
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: COLORS.textLight }}>Loading...</Text>
      </View>
    );
  }
  return null;
}