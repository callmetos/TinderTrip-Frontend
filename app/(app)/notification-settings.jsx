import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/color/colors';
import {
  getNotificationSettings,
  updateNotificationSettings,
  clearBadgeCount,
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleTestNotification,
} from '../../src/utils/notifications';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    chatMessages: true,
    eventUpdates: true,
    joinRequests: true,
    eventReminders: true,
    sound: true,
    vibration: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    
    setSettings(newSettings);
    await updateNotificationSettings(newSettings);
    
    // If enabling notifications for the first time, request permissions
    if (!settings[key]) {
      await requestNotificationPermissions();
    }
  };

  const handleClearBadge = async () => {
    try {
      await clearBadgeCount();
      Alert.alert('Success', 'Badge count cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear badge count');
    }
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              await clearBadgeCount();
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    try {
      // Request permissions first
      const hasPermission = await requestNotificationPermissions();
      
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings');
        return;
      }

      // Schedule a test notification
      await scheduleTestNotification();
      Alert.alert('Success', 'Test notification scheduled! You should receive it in a few seconds.');
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const renderSettingItem = (title, description, key, icon, isLast = false) => (
    <View style={[styles.settingItem, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggle(key)}
        trackColor={{ false: '#e0e0e0', true: COLORS.primary + '50' }}
        thumbColor={settings[key] ? COLORS.primary : '#f4f3f4'}
        ios_backgroundColor="#e0e0e0"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION TYPES</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'Chat Messages',
              'Get notified when someone sends a message',
              'chatMessages',
              'chatbubble'
            )}
            
            {renderSettingItem(
              'Event Updates',
              'Notifications about events you joined',
              'eventUpdates',
              'calendar'
            )}
            
            {renderSettingItem(
              'Join Requests',
              'When someone wants to join your event',
              'joinRequests',
              'person-add'
            )}
            
            {renderSettingItem(
              'Event Reminders',
              'Remind me before events start',
              'eventReminders',
              'alarm',
              true
            )}
          </View>
        </View>

        {/* Notification Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BEHAVIOR</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'Sound',
              'Play sound for notifications',
              'sound',
              'volume-high'
            )}
            
            {renderSettingItem(
              'Vibration',
              'Vibrate on new notifications',
              'vibration',
              'phone-portrait',
              true
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="flask" size={24} color="#2196F3" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Test Notification</Text>
                <Text style={styles.actionDescription}>
                  Send a test notification to your device
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleClearBadge}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="notifications-off" size={24} color="#FF9800" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Clear Badge Count</Text>
                <Text style={styles.actionDescription}>
                  Reset the notification badge on app icon
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { borderBottomWidth: 0 }]}
              onPress={handleClearAllNotifications}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="trash" size={24} color="#e74c3c" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: '#e74c3c' }]}>
                  Clear All Notifications
                </Text>
                <Text style={styles.actionDescription}>
                  Cancel all scheduled notifications
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Customize which notifications you want to receive. You can change these settings anytime.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
