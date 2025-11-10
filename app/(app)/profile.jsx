import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, StatusBar, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/color/colors';
import { useAuth } from '../../src/contexts/AuthContext.js';
import { getUserStats } from '../../src/api/user.service.js';
import { getUserProfile } from '../../src/api/info.service.js';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  const [stats, setStats] = useState({
    events_joined: 0,
    events_liked: 0,
    events_created: 0,
  });

  useEffect(() => {
    // Only fetch when authenticated to avoid 401 spam during startup
    if (isAuthenticated) {
      fetchUserStats();
      loadLocalUser();
    }
  }, [isAuthenticated]);

  // Update local user when context user changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Refresh stats when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchUserStats();
        loadLocalUser();
      }
    }, [isAuthenticated])
  );

  const loadLocalUser = async () => {
    try {
      const raw = await AsyncStorage.getItem('USER_DATA');
      if (raw) {
        const parsed = JSON.parse(raw);
        setLocalUser(parsed);
      }
    } catch (error) {
      console.error('Failed to load local user:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Keep showing zeros if fetch fails
    }
  };

  const fetchAndSyncUserProfile = async () => {
    try {
      const fresh = await getUserProfile();
      console.log('[Profile] Fetched user profile:', fresh);
      
      if (fresh && fresh.data) {
        // API returns { data: { user object }, success: true, ... }
        const userData = fresh.data;
        
        // Merge with existing USER_DATA to preserve email and other fields
        const existingData = await AsyncStorage.getItem('USER_DATA');
        const existing = existingData ? JSON.parse(existingData) : {};
        
        const mergedUser = {
          ...existing,
          ...userData,
          // Ensure email is preserved from existing if not in fresh data
          email: userData.email || existing.email,
        };
        
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(mergedUser));
        setLocalUser(mergedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/information?mode=edit');
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: handleEditProfile,
    },
    {
      icon: 'settings-outline',
      title: 'Preferences',
      subtitle: 'Travel and food preferences',
      onPress: () => Alert.alert('Coming Soon', 'Preferences feature is coming soon!'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notification settings',
      onPress: () => router.push('/notification-settings'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help', 'Contact us at support@tindertrip.com'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('TinderTrip', 'Version 1.0.0'),
    },
  ];

  const displayName = localUser?.display_name || localUser?.email?.split('@')[0] || user?.display_name || user?.email?.split('@')[0] || 'Guest';
  const email = localUser?.email || user?.email || '';

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                try {
                  setRefreshing(true);
                  if (isAuthenticated) {
                    await Promise.all([
                      fetchAndSyncUserProfile(),
                      fetchUserStats(),
                    ]);
                  }
                } finally {
                  setRefreshing(false);
                }
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color={COLORS.redwine} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.events_joined}</Text>
            <Text style={styles.statLabel}>Events Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.events_liked}</Text>
            <Text style={styles.statLabel}>Events Liked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.events_created}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={24} color={COLORS.redwine} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.redwine,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.redwine,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.redwine,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
});
