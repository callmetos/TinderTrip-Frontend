import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

export default function MessagesScreen() {
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/chat/rooms');
      
      // Handle different response formats
      const rooms = res?.data?.rooms || res?.data?.data || [];
      setChatRooms(rooms);
    } catch (err) {
      console.error('Failed to fetch chat rooms', err);
      if (err?.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load messages');
      }
      setChatRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const handleRoomPress = (room) => {
    // TODO: Navigate to chat detail screen
    Alert.alert('Chat', `Opening chat for ${room.event?.title || 'Event'}`);
  };

  const renderChatRoom = ({ item }) => {
    const hasUnread = item.unread_count > 0;
    const lastMessage = item.last_message;
    const eventTitle = item.event?.title || 'Event Chat';
    
    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.event?.cover_image_url ? (
            <View style={styles.avatar}>
              <Ionicons name="images" size={24} color={COLORS.redwine} />
            </View>
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="people" size={24} color={COLORS.redwine} />
            </View>
          )}
          {hasUnread && <View style={styles.unreadBadge} />}
        </View>
        
        <View style={styles.roomContent}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {eventTitle}
            </Text>
            {lastMessage?.created_at && (
              <Text style={styles.timeText}>
                {formatTime(lastMessage.created_at)}
              </Text>
            )}
          </View>
          
          <View style={styles.messageRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {lastMessage?.message || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.metaText}>
              {item.member_count || 0} members
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Chat with your trip members</Text>
      </View>

      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Join events to start chatting with other travelers
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id || item.event_id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    paddingTop: 8,
  },
  roomCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.redwine,
    borderWidth: 2,
    borderColor: '#fff',
  },
  roomContent: {
    flex: 1,
    justifyContent: 'center',
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
  timeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: COLORS.redwine,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 84,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
});
