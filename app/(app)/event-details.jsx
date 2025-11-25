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
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams();
  const { user } = useAuth(); // Get user from AuthContext
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [memberUsers, setMemberUsers] = useState({});

  // Get current user from AuthContext
  const currentUserId = user?.id;
  const currentUserName = user?.display_name || user?.email || 'Someone';

  // Debug: Log params received
  useEffect(() => {
    console.log('EventDetailsScreen params:', { id, from });
  }, [id, from]);

  useEffect(() => {
    loadAuthToken();
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
      console.log('Current user from AuthContext:', { id: user?.id, name: user?.display_name });
    } catch (err) {
      console.error('Failed to load auth token:', err);
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
      setEvent(eventData);
      
      // Fetch user data for each member (including creator)
      if (eventData?.members && eventData.members.length > 0) {
        await fetchMemberUsers(eventData, eventData.members);
      } else {
        // Still try to fetch creator data even if no members
        const organizer = eventData?.created_by || eventData?.creator || eventData?.organizer || eventData?.owner;
        if (organizer?.id) {
          await fetchMemberUsers(eventData, [{ user_id: organizer.id }]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch event details', err);
      Alert.alert('Error', 'Failed to load event details');
      handleGoBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberUsers = async (eventData, members) => {
    try {
      const usersMap = {};
      
      // Use member data directly from the members array
      // The API already provides avatar_url and display_name in the members array
      members.forEach(member => {
        usersMap[member.user_id] = {
          id: member.user_id,
          display_name: member.display_name,
          avatar_url: member.avatar_url,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at
        };
      });
      
      console.log('Fetched member users:', usersMap);
      setMemberUsers(usersMap);
    } catch (err) {
      console.error('Failed to fetch member users:', err);
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
          const notificationMessage = `${currentUserName} joined group`;
          await api.post(`/api/v1/chat/rooms/${eventRoom.id}/messages`, {
            room_id: eventRoom.id,
            body: notificationMessage,
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
          const notificationMessage = `${currentUserName} will go`;
          await api.post(`/api/v1/chat/rooms/${eventRoom.id}/messages`, {
            room_id: eventRoom.id,
            body: notificationMessage,
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
      <View style={styles.container}>
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
        <SafeAreaView style={styles.fixedFloatingHeader} edges={['']}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.floatingButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
                <Ionicons name="pricetag" size={12} color="#fff" />
                <Text style={styles.badgeText}>{event.event_type}</Text>
              </View>
            )}

            {/* Description - Plain text below title */}
            {event.description && (
              <Text style={styles.descriptionText}>{event.description}</Text>
            )}
          </View>

          {/* Quick Info Cards - More Prominent */}
          <View style={styles.quickInfoSection}>
            {/* Date & Time Card */}
            {event.start_at && (
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="calendar" size={24} color={COLORS.redwine} />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>When</Text>
                  <Text style={styles.quickInfoValue}>
                    {(() => {
                      const d = new Date(event.start_at);
                      const day = d.getDate();
                      const month = d.toLocaleString('en-US', { month: 'short' });
                      const year = d.getFullYear();
                      const time = d.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      return `${day} ${month} ${year}`;
                    })()}
                  </Text>
                  <Text style={styles.quickInfoTime}>
                    {new Date(event.start_at).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Location Card */}
            {event.address_text && (
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="location" size={24} color={COLORS.redwine} />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>Where</Text>
                  <Text style={styles.quickInfoValue} numberOfLines={2}>
                    {event.address_text}
                  </Text>
                </View>
              </View>
            )}

            {/* Attendees Card */}
            {capacity != null && (
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="people" size={24} color={COLORS.redwine} />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>Attendees</Text>
                  <Text style={styles.quickInfoValue}>
                    {joined}/{capacity} people
                  </Text>
                  <Text style={styles.quickInfoSubtext}>
                    {capacity - joined} spots left
                  </Text>
                </View>
              </View>
            )}

            {/* Budget Card */}
            {(event.budget_min != null || event.budget_max != null) && (
              <View style={styles.quickInfoCard}>
                <View style={styles.quickInfoIcon}>
                  <Ionicons name="wallet" size={24} color="#4CAF50" />
                </View>
                <View style={styles.quickInfoContent}>
                  <Text style={styles.quickInfoLabel}>Budget</Text>
                  <Text style={styles.quickInfoValue}>
                    {event.budget_min && event.budget_max
                      ? `฿${event.budget_min}-${event.budget_max}`
                      : event.budget_max
                      ? `฿${event.budget_max}`
                      : 'Free'}
                  </Text>
                </View>
              </View>
            )}
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
          {(() => {
            const organizer = event.created_by || event.creator || event.organizer || event.owner;
            if (!organizer) return null;
            
            // Get user data from memberUsers map (same as members below)
            const userData = memberUsers[organizer.id];
            const user = userData || organizer;
            
            const organizerAvatar = 
              userData?.avatar_url || 
              userData?.profile_image_url || 
              userData?.image_url ||
              organizer.avatar_url || 
              organizer.profile_image_url || 
              organizer.image_url;
            
            const organizerName = 
              userData?.display_name || 
              userData?.full_name || 
              userData?.name ||
              organizer.display_name || 
              organizer.full_name || 
              organizer.name ||
              organizer.email || 
              'Anonymous';
            
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hosted by</Text>
                <View style={styles.organizerCard}>
                  <View style={styles.avatarCircle}>
                    {organizerAvatar ? (
                      <Image
                        source={{ 
                          uri: organizerAvatar,
                          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                        }}
                        style={styles.organizerAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={28} color={COLORS.redwine} />
                    )}
                  </View>
                  <View style={styles.organizerInfo}>
                    <Text style={styles.organizerName}>
                      {organizerName}
                    </Text>
                    <Text style={styles.organizerRole}>Event Organizer</Text>
                  </View>
                  <TouchableOpacity style={styles.messageButton}>
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.redwine} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* Members List */}
          {(() => {
            const members = event.members || event.participants || event.attendees || [];
            if (members.length === 0) return null;
            
            const confirmedMembers = members.filter(m => 
              (m.status || m.attendance_status) === 'confirmed'
            );
            const capacity = event?.capacity ?? event?.max_capacity ?? 0;
            const spotsLeft = capacity - confirmedMembers.length;
            
            // Show only first 7 members (6 members + 1 "Add Friends" button)
            const displayMembers = members.slice(0, 7);
            
            return (
              <View style={styles.section}>
                <View style={styles.membersHeader}>
                  <Text style={styles.sectionTitle}>
                    {confirmedMembers.length}/{capacity} Will go • {spotsLeft} spots left
                  </Text>
                  {members.length > 7 && (
                    <TouchableOpacity>
                      <Text style={styles.seeAllButton}>See All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.membersGrid}>
                  {/* Add Friends Button */}
                  <View style={styles.memberGridItem}>
                    <TouchableOpacity style={styles.addFriendsButton}>
                      <Ionicons name="add" size={32} color="#00BCD4" />
                    </TouchableOpacity>
                    <Text style={styles.memberGridName}>Add{'\n'}Friends</Text>
                  </View>
                  
                  {/* Member Items */}
                  {displayMembers.map((member, index) => {
                    // Get user data from fetched users map
                    const userData = memberUsers[member.user_id];
                    const user = userData || member.user || member;
                    const status = member.status || member.attendance_status || 'interested';
                    
                    // Try to get name from multiple possible fields
                    const displayName = 
                      userData?.display_name || 
                      userData?.full_name || 
                      userData?.name ||
                      userData?.email?.split('@')[0] ||
                      member.display_name || 
                      member.full_name || 
                      member.name ||
                      user.display_name || 
                      user.full_name || 
                      user.name ||
                      user.email?.split('@')[0] || 
                      member.email?.split('@')[0] ||
                      `User ${index + 1}`;
                    
                    // Try to get avatar from multiple possible fields
                    const avatarUrl = 
                      userData?.avatar_url || 
                      userData?.profile_image_url || 
                      userData?.image_url ||
                      member.avatar_url || 
                      member.profile_image_url || 
                      member.image_url ||
                      user.avatar_url || 
                      user.profile_image_url ||
                      user.image_url;
                    
                    const isConfirmed = status === 'confirmed';
                    
                    // Split name to max 2 lines
                    const nameParts = displayName.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');
                    const displayText = lastName ? `${firstName}\n${lastName}` : firstName;
                    
                    console.log('Member:', index, 'User ID:', member.user_id, 'Name:', displayName, 'Status:', status, 'Avatar:', avatarUrl);
                    
                    return (
                      <View key={member.id || member.user_id || index} style={styles.memberGridItem}>
                        <View style={styles.memberGridAvatar}>
                          {avatarUrl ? (
                            <Image
                              source={{ 
                                uri: avatarUrl,
                                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                              }}
                              style={styles.memberGridAvatarImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.memberGridAvatarPlaceholder}>
                              <Ionicons name="person" size={28} color="#ccc" />
                            </View>
                          )}
                          {/* Status Icon Badge */}
                          <View style={[
                            styles.memberStatusIcon,
                            isConfirmed ? styles.statusIconConfirmed : styles.statusIconInterested
                          ]}>
                            <Text style={styles.statusIconEmoji}>
                              {isConfirmed ? '⭐' : '🔥'}
                            </Text>
                          </View>
                        </View>
                        <Text 
                          style={[
                            styles.memberGridName,
                            isConfirmed ? styles.memberNameConfirmed : styles.memberNameInterested
                          ]} 
                          numberOfLines={2}
                        >
                          {displayText}
                        </Text>
                        <Text style={[
                          styles.memberGridStatus,
                          isConfirmed ? styles.statusConfirmedText : styles.statusInterestedText
                        ]}>
                          {isConfirmed ? 'Will go' : 'Interested'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}
          
          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Check user status and show appropriate buttons */}
        {(() => {
          const isCreator = currentUserId === event?.creator_id;
          const member = event?.members?.find(m => String(m.user_id) === String(currentUserId));
          const membershipStatus = member?.status || event?.member_status;
          const hasJoined = Boolean(member || event?.is_joined);

          console.log('Bottom bar debug:', { 
            currentUserId: String(currentUserId),
            isCreator, 
            member, 
            membershipStatus, 
            hasJoined,
            allMembers: event?.members?.map(m => ({ id: String(m.user_id), status: m.status }))
          });

          // 1) Not joined at all => Join button
          if (!hasJoined) {
            console.log('Showing JOIN button - user has not joined');
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

          // 2) Joined (pending, confirmed, or creator) => Chat button
          console.log('Showing CHAT button - user has joined with status:', membershipStatus);
          return (
            <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
              <Ionicons name="chatbubble" size={22} color="#fff" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </View>
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
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textLight,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.redwine,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: COLORS.redwine,
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
  quickInfoSection: {
    marginBottom: 24,
    gap: 12,
  },
  quickInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  quickInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 22,
  },
  quickInfoTime: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  quickInfoSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
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
    overflow: 'hidden',
  },
  organizerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BCD4',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  memberGridItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 16,
  },
  addFriendsButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#00BCD4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberGridAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
    position: 'relative',
  },
  memberGridAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  memberGridAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberStatusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusIconConfirmed: {
    backgroundColor: '#FFD700',
  },
  statusIconInterested: {
    backgroundColor: '#FF6B6B',
  },
  statusIconEmoji: {
    fontSize: 12,
  },
  memberGridName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 2,
  },
  memberNameConfirmed: {
    color: '#333',
  },
  memberNameInterested: {
    color: '#333',
  },
  memberGridStatus: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusConfirmedText: {
    color: '#4CAF50',
  },
  statusInterestedText: {
    color: '#FF9800',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: 48,
    height: 48,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusConfirmed: {
    backgroundColor: '#E8F5E9',
  },
  statusInterested: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
