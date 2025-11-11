import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';
import { useAuth } from '../../src/contexts/AuthContext';

const UNREAD_COUNT_KEY = 'TOTAL_UNREAD_COUNT';
const LAST_READ_KEY = 'CHAT_LAST_READ_';

export default function AppLayout() {
  const { user } = useAuth(); // Get current user
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef(null);
  const isCalculating = useRef(false);

  useEffect(() => {
    // Load unread count immediately on mount
    calculateUnreadCount();

    // Set up interval to check for updates every 5 seconds (reduced from 3)
    pollingInterval.current = setInterval(() => {
      calculateUnreadCount();
    }, 5000);

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground, refresh unread count
        console.log('App came to foreground, refreshing unread count');
        calculateUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      subscription?.remove();
    };
  }, []);

  const calculateUnreadCount = async () => {
    // Prevent concurrent calculations
    if (isCalculating.current) {
      console.log('Already calculating, skipping...');
      return;
    }
    
    isCalculating.current = true;
    const currentUserId = user?.id; // Get current user ID
    
    try {
      // Fetch all chat rooms
      const response = await api.get('/api/v1/chat/rooms');
      const rooms = response.data.rooms || [];
      
      let totalUnread = 0;
      
      // Check unread messages for each room
      await Promise.all(
        rooms.map(async (room) => {
          try {
            // Get latest message
            const msgResponse = await api.get(`/api/v1/chat/rooms/${room.id}/messages`, {
              params: { page: 1, limit: 1 }
            });
            const messages = msgResponse.data.messages || [];
            
            if (messages.length > 0) {
              const lastMessageId = messages[0].id;
              const lastReadId = await AsyncStorage.getItem(`${LAST_READ_KEY}${room.id}`);
              
              // If there's a new message
              if (lastReadId && lastMessageId !== lastReadId) {
                // Fetch unread count
                const unreadResponse = await api.get(`/api/v1/chat/rooms/${room.id}/messages`, {
                  params: { page: 1, limit: 50 }
                });
                const allMessages = unreadResponse.data.messages || [];
                const lastReadIndex = allMessages.findIndex(msg => msg.id === lastReadId);
                
                if (lastReadIndex >= 0) {
                  // Count only messages from other users
                  const unreadFromOthers = allMessages.slice(0, lastReadIndex).filter(msg => 
                    String(msg.sender_id) !== String(currentUserId)
                  ).length;
                  totalUnread += unreadFromOthers;
                } else if (allMessages.length > 0) {
                  // Count messages from other users
                  const unreadFromOthers = allMessages.filter(msg => 
                    String(msg.sender_id) !== String(currentUserId)
                  ).length;
                  totalUnread += unreadFromOthers;
                }
              } else if (!lastReadId) {
                // No last read record, count all messages from others
                const unreadResponse = await api.get(`/api/v1/chat/rooms/${room.id}/messages`, {
                  params: { page: 1, limit: 50 }
                });
                const allMessages = unreadResponse.data.messages || [];
                const unreadFromOthers = allMessages.filter(msg => 
                  String(msg.sender_id) !== String(currentUserId)
                ).length;
                totalUnread += unreadFromOthers;
              }
            }
          } catch (err) {
            console.error(`Failed to check unread for room ${room.id}:`, err);
          }
        })
      );
      
      // console.log('Calculated total unread (from others only):', totalUnread);
      setTotalUnreadCount(totalUnread);
      await AsyncStorage.setItem(UNREAD_COUNT_KEY, totalUnread.toString());
    } catch (err) {
      console.error('Failed to calculate unread count:', err);
      // Fallback to stored value
      try {
        const storedCount = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
        if (storedCount) {
          setTotalUnreadCount(parseInt(storedCount, 10));
        }
      } catch (storageErr) {
        console.error('Failed to load stored count:', storageErr);
      }
    } finally {
      isCalculating.current = false;
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.redwine,
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: 20,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: 'My Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble" size={size} color={color} />
              {totalUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Hide chat-room from tabs - it's a detail page but keep tab bar visible */}
      <Tabs.Screen
        name="chat-room"
        options={{
          href: null,
          tabBarStyle: {
            display: 'flex',
          },
        }}
      />
      {/* Hide event-details from tabs - it's a detail page */}
      <Tabs.Screen
        name="event-details"
        options={{
          href: null,
        }}
      />
      {/* Hide welcome from tabs */}
      <Tabs.Screen
        name="welcome"
        options={{
          href: null,
        }}
      />
      {/* Hide information from tabs */}
      <Tabs.Screen
        name="information"
        options={{
          href: null,
        }}
      />
      {/* Hide notification-settings from tabs */}
      <Tabs.Screen
        name="notification-settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.redwine,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
