import { COLORS } from '@/color/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../../assets/styles/auth-styles.js';
import { AlertModal } from '../../src/utils/alerts';
import { handleLogout, performLogout } from '../../src/utils/logout';

const WelcomeScreen = () => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const onLogoutConfirm = () => performLogout(router);

  const onLogoutPress = () => handleLogout(onLogoutConfirm, setShowLogoutModal);

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
        onPress={onLogoutPress}
      >
        <Text style={{ color: COLORS.shadow, fontSize: 16, fontWeight: '600' }}>
          Logout
        </Text>
      </TouchableOpacity>

      {/* Logout Confirmation Alert for Web */}
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

    </SafeAreaView>
  )
}

export default WelcomeScreen