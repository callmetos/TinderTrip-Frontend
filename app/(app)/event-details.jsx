import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    loadAuthToken();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  // Refresh details whenever screen gains focus (e.g., after confirming in chat)
  useFocusEffect(
    React.useCallback(() => {
      if (id) fetchEventDetails();
    }, [id])
  );

  const loadAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('TOKEN');
      setAuthToken(token);
    } catch (err) {
      console.error('Failed to load auth token:', err);
    }
  };

  const loadCurrentUser = async () => {
    try {
      let userStr = await AsyncStorage.getItem('USER_DATA');
      if (!userStr) {
        userStr = await AsyncStorage.getItem('user');
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setCurrentUserName(user.display_name || user.email || 'Someone');
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const handleGoBack = () => {
    if (from) {
      // Go back to specific tab
      router.replace(`/${from}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/events/${id}`);
      const eventData = res?.data?.data || res?.data;
      console.log('Event data:', eventData);
      console.log('start_at:', eventData?.start_at);
      setEvent(eventData);
    } catch (err) {
      console.error('Failed to fetch event details', err);
      Alert.alert('Error', 'Failed to load event details');
      handleGoBack();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    try {
      setJoining(true);
      await api.post(`/api/v1/events/${id}/join`);
      
      // Send notification message to chat
      try {
        const roomsResponse = await api.get('/api/v1/chat/rooms');
        const rooms = roomsResponse.data?.rooms || [];
        const eventRoom = rooms.find(room => room.event_id === id);
        
        if (eventRoom) {
          const notificationMessage = `${currentUserName} has joined the event! 🎉`;
          await api.post(`/api/v1/chat/rooms/${eventRoom.id}/messages`, {
            message: notificationMessage,
            message_type: 'system'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send chat notification:', chatErr);
        // Don't block the join process if chat notification fails
      }
      
      Alert.alert('Success', 'You have joined this event!');
      fetchEventDetails(); // Refresh to update join status
    } catch (err) {
      console.error('Failed to join event', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Failed to join event';
      
      if (status === 400) {
        Alert.alert('Cannot Join', message);
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login again');
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLikeEvent = async () => {
    try {
      await api.post(`/api/v1/events/${id}/swipe`, {
        event_id: id,
        direction: 'like',
      });
      Alert.alert('Liked', 'Event added to your liked list!');
    } catch (err) {
      console.error('Failed to like event', err);
    }
  };

  const handleConfirmAttendance = async () => {
    try {
      setJoining(true);
      await api.post(`/api/v1/events/${id}/confirm`);
      
      // Send notification message to chat
      try {
        const roomsResponse = await api.get('/api/v1/chat/rooms');
        const rooms = roomsResponse.data?.rooms || [];
        const eventRoom = rooms.find(room => room.event_id === id);
        
        if (eventRoom) {
          const notificationMessage = `${currentUserName} confirmed their attendance! ✅`;
          await api.post(`/api/v1/chat/rooms/${eventRoom.id}/messages`, {
            message: notificationMessage,
            message_type: 'system'
          });
        }
      } catch (chatErr) {
        console.error('Failed to send chat notification:', chatErr);
        // Don't block the confirm process if chat notification fails
      }
      
      Alert.alert('Success', 'You confirmed your attendance!');
      fetchEventDetails(); // Refresh to update status
    } catch (err) {
      console.error('Failed to confirm attendance', err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Failed to confirm attendance';
      
      if (status === 409) {
        Alert.alert('Info', 'You have already confirmed this event');
        fetchEventDetails();
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleOpenChat = async () => {
    try {
      // Get chat room for this event
      const roomsResponse = await api.get('/api/v1/chat/rooms');
      const rooms = roomsResponse.data?.rooms || [];
      const eventRoom = rooms.find(room => room.event_id === id);
      
      if (eventRoom) {
        router.push({
          pathname: '/chat-room',
          params: {
            roomId: eventRoom.id,
            eventId: id,
            eventTitle: event?.title || 'Chat',
            from: from || 'event-details'
          }
        });
      } else {
        Alert.alert('Error', 'Chat room not found');
      }
    } catch (err) {
      console.error('Failed to open chat', err);
      Alert.alert('Error', 'Failed to open chat');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const capacity = event?.capacity ?? event?.max_capacity ?? null;
  const joined =
    event?.attendees_count ??
    event?.member_count ??
    event?.participants_count ??
    event?.joined_count ??
    0;

  return (
      <SafeAreaView style={styles.container}>
      {/* Fixed Cover Image - Behind Everything */}
      <View style={styles.fixedCoverSection}>
        {event.cover_image_url ? (
          <Image
            source={{ 
              uri: event.cover_image_url,
              headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={60} color="#ccc" />
          </View>
        )}
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />
      </View>

      {/* Floating Header - Fixed Position */}
        <SafeAreaView style={styles.fixedFloatingHeader} edges={['top']}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.floatingButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLikeEvent} style={styles.floatingButton}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
        </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Spacer for cover image */}
          <View style={{ height: width * 0.75 - 60 }} />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
              <Text style={styles.title}>{event.title}</Text>
            
            {/* Event Type Badge */}
            {event.event_type && (
              <View style={styles.badge}>
                <Ionicons name="pricetag" size={12} color={COLORS.redwine} />
                <Text style={styles.badgeText}>{event.event_type}</Text>
                </View>
            )}
          </View>

          <View style={styles.statsGrid}>
            {capacity != null && (
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="people" size={24} color={COLORS.redwine} />
                </View>
                <Text style={styles.statValue}>{joined}/{capacity}</Text>
                <Text style={styles.statLabel}>Attendees</Text>
              </View>
            )}
            
            {(event.budget_min != null || event.budget_max != null) && (
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="wallet" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>
                  {event.budget_min && event.budget_max
                    ? `฿${event.budget_min}-${event.budget_max}`
                    : event.budget_max
                    ? `฿${event.budget_max}`
                    : 'Free'}
                </Text>
                <Text style={styles.statLabel}>Budget</Text>
              </View>
            )}
            
            {event.start_at && (
              <View style={styles.statCard}>
                <View style={styles.statIconWrapper}>
                  <Ionicons name="calendar" size={24} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>
                  {new Date(event.start_at).getDate()}
                </Text>
                <Text style={styles.statLabel}>
                  {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description || 'No description provided'}</Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={24} color={COLORS.redwine} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoText}>{event.address_text || 'Location TBD'}</Text>
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="time" size={24} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>When</Text>
                <Text style={styles.infoText}>{formatDate(event.start_at)}</Text>
                {event.end_at && (
                  <Text style={styles.infoTextSecondary}>Until {formatDate(event.end_at)}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag.name || tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Organizer Info */}
          {event.created_by && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hosted by</Text>
              <View style={styles.organizerCard}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={28} color={COLORS.redwine} />
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>
                    {event.created_by.display_name || event.created_by.email || 'Anonymous'}
                  </Text>
                  <Text style={styles.organizerRole}>Event Organizer</Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.redwine} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Check user status and show appropriate buttons */}
        {(() => {
          const isCreator = currentUserId === event?.creator_id;
          const member = event?.members?.find(m => m.user_id === currentUserId);
          const membershipStatus = member?.status || event?.member_status || (event?.is_confirmed ? 'confirmed' : null);
          const hasJoined = Boolean(event?.is_joined || member);
          const hasConfirmed = membershipStatus === 'confirmed' || Boolean(event?.is_confirmed);

          // 1) Creator => Chat only
          if (isCreator) {
            return (
              <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
                <Ionicons name="chatbubble" size={22} color="#fff" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            );
          }

          // 2) Confirmed member => Chat only
          if (hasConfirmed) {
            return (
              <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
                <Ionicons name="chatbubble" size={22} color="#fff" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>
            );
          }

          // 3) Not joined at all => Join button
          if (!hasJoined) {
            return (
              <TouchableOpacity
                style={[styles.joinButton, joining && styles.joinButtonDisabled]}
                onPress={handleJoinEvent}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.joinButtonText}>Join Event</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          }

          // 4) Joined but not confirmed => show Chat + Confirm (ตามที่ผู้ใช้ต้องการ)
          return (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.chatButtonHalf} onPress={handleOpenChat}>
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButtonHalf, joining && styles.joinButtonDisabled]}
                onPress={handleConfirmAttendance}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  coverSection: {
    position: 'relative',
  },
  fixedCoverSection: {
    position: 'absolute',
    top: 0,
      left: 0,
    right: 0,
    zIndex: 0,
    },
  coverImage: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fixedFloatingHeader: {
    position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 28,
    zIndex: 100,
    elevation: 100,
  },
  floatingHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 28,
    minHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textLight,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 18,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  infoTextSecondary: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tagText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  organizerRole: {
    fontSize: 13,
    color: '#666',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redwine,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    gap: 10,
    elevation: 5,
    shadowColor: COLORS.redwine,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redwine,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
    gap: 10,
    elevation: 5,
    shadowColor: COLORS.redwine,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  chatButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  chatButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redwine,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: COLORS.redwine,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  confirmButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24953eff',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    elevation: 4,
    shadowColor: '#24953eff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.redwine,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
