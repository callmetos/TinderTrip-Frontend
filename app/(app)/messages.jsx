import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

export default function ChatListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [lastMessages, setLastMessages] = useState({});

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      
      // Fetch chat rooms
      const response = await api.get('/api/v1/chat/rooms');
      const rooms = response.data.rooms || [];
      
      // Fetch user's joined events to filter chat rooms
      const eventsResponse = await api.get('/api/v1/events', {
        params: { page: 1, limit: 100, status: 'published' },
      });
      const allEvents = eventsResponse?.data?.data || [];
      const joinedEvents = allEvents.filter(event => event.is_joined === true);
      const joinedEventIds = joinedEvents.map(event => event.id);
      
      console.log('Joined event IDs:', joinedEventIds);
      
      // Filter rooms to only show those for joined events
      const filteredRooms = rooms.filter(room => {
        const isJoined = joinedEventIds.includes(room.event_id);
        console.log('Room:', room.id, 'Event:', room.event_id, 'Is Joined:', isJoined);
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
    }
  };

  const fetchLastMessages = async (rooms) => {
    try {
      const messagesMap = {};
      
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
            }
          } catch (err) {
            console.error(`Failed to fetch messages for room ${room.id}:`, err);
          }
        })
      );
      
      setLastMessages(messagesMap);
      
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
    fetchChatRooms();
  };

  const handleRoomPress = (room) => {
    console.log('Opening chat room:', room.id, 'Event:', room.event?.title);
    router.push({
      pathname: '/chat-room',
      params: { 
        roomId: room.id,
        eventTitle: room.event?.title || 'Chat',
        from: 'messages'
      }
    });
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
    
    return (
      <TouchableOpacity 
        style={styles.roomCard}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.roomIcon}>
          <Ionicons name="people" size={24} color={COLORS.redwine} />
        </View>
        
        <View style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {item.event?.title || 'Event Chat'}
            </Text>
            <Text style={styles.roomTime}>
              {lastMessage 
                ? formatDate(lastMessage.created_at)
                : formatDate(item.created_at)
              }
            </Text>
          </View>
          
          <Text style={styles.roomLocation} numberOfLines={1}>
            {item.event?.address_text || 'No location'}
          </Text>
          
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.sender?.full_name || 'Someone'}: {lastMessage.body || 'Message'}
            </Text>
          )}
          
          <View style={styles.roomFooter}>
            <View style={styles.memberBadge}>
              <Ionicons name="person" size={12} color={COLORS.textLight} />
              <Text style={styles.memberCount}>
                {item.event?.member_count || 0} members
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  roomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  roomTime: {
    fontSize: 12,
    color: COLORS.textLight,
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
