import { COLORS } from '@/color/colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../assets/styles/auth-styles.js';

const WelcomeScreen = () => {
  const router = useRouter();

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

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.background}}>
      <View style = {styles.container}>
        <View style = {styles.profileIconCircle}>
          <Ionicons name="person" size={100} color = {COLORS.redwine}/>
        </View>
        <Text style = {styles.title} >Create Your Profile</Text>
        <Text style = {styles.subtitle}>To know more about you? Find more compatible people, places and group</Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/infomation')}>
        <View style={styles.buttonProfile}>
          <Text style={styles.buttonText}>Get Started</Text>
        </View>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.expense,
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginHorizontal: 20,
          marginBottom: 20
        }}
        onPress={handleLogout}
      >
        <Text style={{ color: COLORS.shadow, fontSize: 16, fontWeight: '600' }}>
          Logout
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  )
}

export default WelcomeScreen