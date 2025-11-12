import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import ChatRoomModal from '../../src/components/ChatRoomModal';

const LAST_READ_KEY = 'CHAT_LAST_READ_';
const UNREAD_COUNT_KEY = 'TOTAL_UNREAD_COUNT';

export default function ChatListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth(); // Get current user
  const [loading, setLoading] = useState(false); // Start as false to avoid loading screen
  const [refreshing, setRefreshing] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Modal state
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchChatRooms(true); // Initial fetch
  }, []);

  // Re-fetch chat rooms whenever the screen gains focus (e.g., after leaving an event)
  useFocusEffect(
    useCallback(() => {
      fetchChatRooms(false); // Silent refresh on focus
      return undefined;
    }, [])
  );

  const fetchChatRooms = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Fetch chat rooms
      const response = await api.get('/api/v1/chat/rooms');
      const rooms = response.data.rooms || [];
      
      // Fetch user's joined events using dedicated endpoint
      const eventsResponse = await api.get('/api/v1/events/joined', {
        params: { page: 1, limit: 100 },
      });
      const joinedEvents = eventsResponse?.data?.data || [];
      const joinedEventIds = joinedEvents.map(event => event.id);
      
      // Create a map of event data from joined events (has complete member data)
      const eventDataMap = {};
      joinedEvents.forEach(event => {
        eventDataMap[event.id] = event;
      });
      
      console.log('Joined event IDs:', joinedEventIds);
      console.log('Event data map:', eventDataMap);
      
      // Filter rooms to only show those for joined events and merge complete event data
      const filteredRooms = rooms.filter(room => {
        const isJoined = joinedEventIds.includes(room.event_id);
        // Replace room's event data with complete data from joined events
        if (isJoined && eventDataMap[room.event_id]) {
          room.event = eventDataMap[room.event_id];
        }
        console.log('Room:', room.id, 'Event:', room.event_id, 'Member count:', room.event?.member_count, 'Members:', room.event?.members?.length);
        return isJoined;
      });
      
      console.log('Total rooms:', rooms.length, 'Filtered rooms:', filteredRooms.length);
      setChatRooms(filteredRooms);
      
      // Fetch last message for filtered rooms
      await fetchLastMessages(filteredRooms);
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  };

  const fetchLastMessages = async (rooms) => {
    try {
      const messagesMap = {};
      const unreadMap = {};
      const currentUserId = user?.id; // Get current user ID
      
      // Fetch last message for each room (limit 1)
      await Promise.all(
        rooms.map(async (room) => {
          try {
            const msgResponse = await api.get(`/api/v1/chat/rooms/${room.id}/messages`, {
              params: { page: 1, limit: 1 }
            });
            const messages = msgResponse.data.messages || [];
            if (messages.length > 0) {
              messagesMap[room.id] = messages[0];
              
              // Get last read message ID for this room
              const lastReadId = await AsyncStorage.getItem(`${LAST_READ_KEY}${room.id}`);
              
              // Count unread messages (simple: if last message is newer than last read)
              if (lastReadId) {
                const lastMessageId = messages[0].id;
                if (lastMessageId !== lastReadId) {
                  // Fetch unread count by getting all messages since last read
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
                    unreadMap[room.id] = unreadFromOthers;
                  } else if (allMessages.length > 0) {
                    // Last read message not in recent 50, count messages from others
                    const unreadFromOthers = allMessages.filter(msg => 
                      String(msg.sender_id) !== String(currentUserId)
                    ).length;
                    unreadMap[room.id] = unreadFromOthers;
                  }
                }
              } else {
                // No last read record, count all messages from others as unread
                const unreadResponse = await api.get(`/api/v1/chat/rooms/${room.id}/messages`, {
                  params: { page: 1, limit: 50 }
                });
                const allMessages = unreadResponse.data.messages || [];
                const unreadFromOthers = allMessages.filter(msg => 
                  String(msg.sender_id) !== String(currentUserId)
                ).length;
                unreadMap[room.id] = unreadFromOthers;
              }
            }
          } catch (err) {
            console.error(`Failed to fetch messages for room ${room.id}:`, err);
          }
        })
      );
      
      setLastMessages(messagesMap);
      setUnreadCounts(unreadMap);
      
      // Calculate total unread count and save to AsyncStorage
      const totalUnread = Object.values(unreadMap).reduce((sum, count) => sum + count, 0);
      await AsyncStorage.setItem(UNREAD_COUNT_KEY, totalUnread.toString());
      console.log('Total unread messages (from others only):', totalUnread);
      
      // Sort rooms by last message time
      sortRoomsByActivity(rooms, messagesMap);
    } catch (err) {
      console.error('Failed to fetch last messages:', err);
    }
  };

  const sortRoomsByActivity = (rooms, messagesMap) => {
    const sortedRooms = [...rooms].sort((a, b) => {
      const lastMessageA = messagesMap[a.id];
      const lastMessageB = messagesMap[b.id];
      
      // Get the most recent time for each room (either last message or room creation)
      const timeA = lastMessageA 
        ? new Date(lastMessageA.created_at).getTime() 
        : new Date(a.created_at).getTime();
      const timeB = lastMessageB 
        ? new Date(lastMessageB.created_at).getTime() 
        : new Date(b.created_at).getTime();
      
      // Sort descending (most recent first)
      return timeB - timeA;
    });
    
    setChatRooms(sortedRooms);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms(false);
  };

  const handleRoomPress = (room) => {
    console.log('Opening chat room:', room.id, 'Event:', room.event?.title);
    
    // Mark as read when opening (save last message ID)
    const lastMessage = lastMessages[room.id];
    if (lastMessage) {
      AsyncStorage.setItem(`${LAST_READ_KEY}${room.id}`, lastMessage.id);
      // Clear unread count for this room
      setUnreadCounts(prev => {
        const newCounts = {
          ...prev,
          [room.id]: 0
        };
        // Update total unread count
        const totalUnread = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        AsyncStorage.setItem(UNREAD_COUNT_KEY, totalUnread.toString());
        return newCounts;
      });
    }
    
    // Hide tab bar
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });
    
    // Open as modal overlay instead of navigation
    setSelectedRoom(room);
    setChatModalVisible(true);
  };

  const handleCloseModal = () => {
    // Show tab bar again
    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: 20,
        paddingTop: 8,
        height: 80,
        display: 'flex',
      }
    });
    
    setChatModalVisible(false);
    setSelectedRoom(null); // Reset selected room
    // Refresh chat rooms when modal closes
    fetchChatRooms(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderChatRoom = ({ item }) => {
    const lastMessage = lastMessages[item.id];
    const unreadCount = unreadCounts[item.id] || 0;
    const hasUnread = unreadCount > 0;
    
    return (
      <TouchableOpacity 
        style={[styles.roomCard, hasUnread && styles.roomCardUnread]}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.roomIcon}>
          <Ionicons name="people" size={24} color={COLORS.redwine} />
          {hasUnread && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <Text style={[styles.roomTitle, hasUnread && styles.roomTitleUnread]} numberOfLines={1}>
              {item.event?.title || 'Event Chat'}
            </Text>
            <View style={styles.headerRight}>
              <Text style={[styles.roomTime, hasUnread && styles.roomTimeUnread]}>
                {lastMessage 
                  ? formatDate(lastMessage.created_at)
                  : formatDate(item.created_at)
                }
              </Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {lastMessage && (
            <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {lastMessage.sender?.display_name || 'Someone'}: {lastMessage.body || 'Message'}
            </Text>
          )}
          
          <View style={styles.roomFooter}>
            <View style={styles.memberBadge}>
              <Ionicons name="person" size={12} color={COLORS.textLight} />
              <Text style={styles.memberCount}>
                {(() => {
                  // Calculate members from members array or use member_count
                  const memberCount = item.event?.members?.filter(m => m.status === 'confirmed').length 
                    || item.event?.member_count 
                    || 0;
                  const capacity = item.event?.capacity || 0;
                  return `${memberCount}/${capacity} people`;
                })()}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptyText}>
        Join an event to start chatting with other members
      </Text>
    </View>
  );

  if (loading && initialLoad) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.redwine} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {chatRooms.length} {chatRooms.length === 1 ? 'conversation' : 'conversations'}
        </Text>
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          chatRooms.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.redwine}
          />
        }
      />

      {/* Chat Room Modal Overlay */}
      {selectedRoom && (
        <ChatRoomModal
          visible={chatModalVisible}
          onClose={handleCloseModal}
          roomId={selectedRoom.id}
          eventId={selectedRoom.event?.id}
          eventTitle={selectedRoom.event?.title || 'Chat'}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roomCardUnread: {
    backgroundColor: '#fff9f9',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.redwine,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.redwine,
    borderWidth: 2,
    borderColor: '#fff',
  },
  roomContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  roomTitleUnread: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  roomTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  roomTimeUnread: {
    color: COLORS.redwine,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.redwine,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  roomLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  lastMessageUnread: {
    color: '#333',
    fontWeight: '500',
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
