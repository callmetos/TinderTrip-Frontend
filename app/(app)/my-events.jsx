import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/api/client.js';
import { COLORS, FONTS } from '@/color/colors';

const TABS = ['Upcoming', 'Past'];

export default function MyEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Upcoming');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  // Refresh automatically whenever the screen gains focus (navigate to My Trips)
  useFocusEffect(
    React.useCallback(() => {
      // Use refreshing indicator if we already have data to avoid full-screen flicker
      fetchMyEvents(false);
    }, [])
  );

  const fetchMyEvents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      // Fetch only joined events using dedicated endpoint
      const res = await api.get('/api/v1/events/joined', {
        params: { page: 1, limit: 100 },
      });
      
      const joinedEvents = res?.data?.data || [];
      
      // Fetch photos for each event
      const eventsWithPhotos = await Promise.all(
        joinedEvents.map(async (event) => {
          try {
            const photosRes = await api.get(`/api/v1/events/${event.id}/photos`);
            const photos = photosRes?.data?.data || photosRes?.data || [];
            return {
              ...event,
              photos: photos,
              cover_image_url: photos.length > 0 ? photos[0].url : event.cover_image_url
            };
          } catch (err) {
            // Silently handle 404 - event might not have photos endpoint
            if (err?.response?.status !== 404) {
              console.error(`Failed to fetch photos for event ${event.id}`, err);
            }
            return event;
          }
        })
      );

      console.log('Total joined events:', eventsWithPhotos.length);
      setEvents(eventsWithPhotos);
    } catch (err) {
      console.error('Failed to fetch my events', err);
      Alert.alert('Error', 'Failed to load your events');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    // Pull-to-refresh: show only the refreshing indicator
    fetchMyEvents(false);
  };

  const handleLeaveEvent = async (eventId) => {
    Alert.alert(
      'Leave Event',
      'Are you sure you want to leave this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/v1/events/${eventId}/leave`);
              
              // Remove the event from the list immediately
              setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
              
              Alert.alert('Success', 'You have left the event');
            } catch (err) {
              console.error('Failed to leave event', err);
              const errorMessage = err?.response?.data?.message || 'Failed to leave event';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleOpenChat = async (event) => {
    try {
      // Find the chat room for this event
      const roomsResponse = await api.get('/api/v1/chat/rooms');
      const rooms = roomsResponse.data.rooms || [];
      
      console.log('Looking for chat room for event:', event.id);
      console.log('Available rooms:', rooms.map(r => ({ id: r.id, event_id: r.event_id })));
      
      // Find room that matches this event ID
      const eventRoom = rooms.find(room => room.event_id === event.id);
      
      if (eventRoom) {
        console.log('Found room:', eventRoom.id, 'for event:', event.id);
        // Navigate to the chat room
        router.push({
          pathname: '/chat-room',
          params: { 
            roomId: eventRoom.id,
            eventId: event.id,
            eventTitle: event.title,
            from: 'my-events'
          }
        });
      } else {
        console.log('No room found for event:', event.id);
        Alert.alert('Info', 'Chat room not available yet. It will be created when the event starts.');
      }
    } catch (err) {
      console.error('Failed to open chat', err);
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.start_at || Date.now());
    const now = new Date();
    
    if (selectedTab === 'Upcoming') {
      return eventDate >= now;
    } else {
      return eventDate < now;
    }
  });

  const renderEventCard = ({ item }) => {
    const isPast = new Date(item.start_at) < new Date();
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/event-details',
          params: { id: item.id, from: 'my-events' }
        })}
      >
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.metaText}>
              {item.start_at ? (() => {
                const d = new Date(item.start_at);
                const day = d.getDate();
                const month = d.toLocaleString('en-US', { month: 'long' });
                const year = d.getFullYear();
                return `${day} ${month} ${year}`;
              })() : 'TBA'}
            </Text>
          </View>
          
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address_text}</Text>
          </View>
          
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.metaText}>{item.member_count || 0} members</Text>
          </View>
          
          <View style={styles.actions}>
            {!isPast && (
              <>
                <TouchableOpacity 
                  style={[styles.button, styles.chatButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenChat(item);
                  }}
                >
                  <Ionicons name="chatbubble" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.leaveButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLeaveEvent(item.id);
                  }}
                >
                  <Text style={[styles.buttonText, { color: '#e74c3c' }]}>Leave</Text>
                </TouchableOpacity>
              </>
            )}
            
            {isPast && (
              <TouchableOpacity style={[styles.button, styles.viewButton]}>
                <Text style={[styles.buttonText, { color: COLORS.textLight }]}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['']}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={styles.loadingText}>Loading your events...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <Text style={styles.headerSubtitle}>Events you've joined</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {selectedTab === 'Upcoming' ? 'No upcoming trips' : 'No past trips'}
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedTab === 'Upcoming'
              ? 'Join events to start your adventure!'
              : 'Your past events will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.redwine,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 160,
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.promptBold,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 6,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  chatButton: {
    backgroundColor: COLORS.redwine,
  },
  leaveButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  viewButton: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
