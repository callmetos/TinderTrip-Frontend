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

  const renderSettingItem = (title, description, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.redwine} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggle(key)}
        trackColor={{ false: '#e0e0e0', true: COLORS.redwine + '80' }}
        thumbColor={settings[key] ? COLORS.redwine : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
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
            'alarm'
          )}
        </View>

        {/* Notification Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Behavior</Text>
          
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
            'phone-portrait'
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleClearBadge}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-off" size={24} color="#FF9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Clear Badge Count</Text>
              <Text style={styles.actionDescription}>
                Reset the notification badge on app icon
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAllNotifications}
          >
            <View style={styles.iconContainer}>
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
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.textLight} />
          <Text style={styles.infoText}>
            Notifications help you stay updated with your trips and messages. You can
            customize which notifications you want to receive.
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});
