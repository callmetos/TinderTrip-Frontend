import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';

export default function Welcome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('USER_DATA');
      const token = await AsyncStorage.getItem('TOKEN');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // ลบข้อมูลทั้งหมดจาก AsyncStorage
              await AsyncStorage.clear();
              setUser(null);
              console.log('About to navigate to /login');
              router.replace('/login');
              console.log('Navigation completed');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { padding: 20 }]}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Welcome
      </Text>
      
      {user ? (
        <View>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Hello, {user.display_name}!
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 20, color: COLORS.textLight }}>
            Email: {user.email}
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.expense,
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 20
            }}
            onPress={handleLogout}
          >
            <Text style={{ color: COLORS.shadow , fontSize: 16, fontWeight: '600' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            Please login to continue
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              padding: 15,
              borderRadius: 10,
              alignItems: 'center'
            }}
            onPress={() => router.replace('/login')}
          >
            <Text style={{ color: COLORS.shadow, fontSize: 16, fontWeight: '600' }}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Link href="/home">
        
      </Link>
    </View>
  );
}