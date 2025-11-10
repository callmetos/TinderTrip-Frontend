import { COLORS } from '@/color/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../assets/styles/auth-styles.js';
import { useAuth } from '../../src/contexts/AuthContext.js';
import { getSetupStatus } from '../../src/api/auth.service.js';
import { AlertModal } from '../../src/utils/alerts.js';
import { isWeb } from '../../src/utils/platform.js';

const WelcomeScreen = () => {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSetup = async () => {
      try {
        setLoading(true);
        const res = await getSetupStatus();
        const setupCompleted = res?.data?.setup_completed ?? false;

        if (!mounted) return;

        // If profile is already completed, send user to home. Otherwise to information page.
        if (setupCompleted) {
          router.replace('/home');
        } else {
          router.replace('/information');
        }
      } catch (err) {
        // If unauthorized, redirect to login. Otherwise show an alert and keep user on welcome.
        const status = err?.response?.status;
        if (status === 401) {
          router.replace('/login');
        } else {
          console.error('Failed to fetch setup status', err);
          // Use native alert as a fallback
          Alert.alert('Error', 'Unable to check setup status. Please try again later.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Only run check if we have a user (ProtectedRoute should ensure auth),
    // but guard in case user is not yet populated.
    if (user) {
      checkSetup();
    } else {
      // If no user, stop loading so UI remains responsive. ProtectedRoute may redirect.
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user, router]);

  const onLogoutConfirm = async () => {
    const logoutSuccess = await logout();
    if (logoutSuccess) {
      router.replace('/login');
    }
  };

  const onLogoutPress = () => {
    if (isWeb) {
      // สำหรับ web ใช้ AlertModal
      setShowLogoutModal(true);
    } else {
      // สำหรับ mobile ใช้ Alert.alert
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
            onPress: onLogoutConfirm,
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
        <Text style={{ color: COLORS.textLight }}>Checking setup...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.background}}>
      <View style = {styles.container}>
        <View style = {styles.profileIconCircle}>
          <Ionicons name="person" size={100} color = {COLORS.redwine}/>
        </View>
        <Text style = {styles.title} >Create Your Profile</Text>
        <Text style = {styles.subtitle}>To know more about you? Find more compatible people, places and group</Text>
        
        {/* แสดงข้อมูล user ถ้ามี */}
        {user && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: COLORS.textLight, fontSize: 16 }}>
              Welcome, {user.display_name || user.email}!
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() => router.push('/information')}>
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
        onPress={onLogoutPress}
      >
        <Text style={{ color: COLORS.shadow, fontSize: 16, fontWeight: '600' }}>
          Logout
        </Text>
      </TouchableOpacity>

      {/* Logout Confirmation Alert for Web */}
      {isWeb && (
        <AlertModal
          visible={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          title="Logout"
          message="Are you sure you want to logout?"
          iconName="log-out-outline"
          iconColor={COLORS.expense}
          confirmText="Logout"
          cancelText="Cancel"
          onConfirm={onLogoutConfirm}
          confirmButtonColor={COLORS.expense}
        />
      )}

    </SafeAreaView>
  )
}

export default WelcomeScreen