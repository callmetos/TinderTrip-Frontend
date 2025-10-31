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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

const { width } = Dimensions.get('window');

export default function EventDetailsScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

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
            // source={{ uri: event.cover_image_url }}
            source={require('../../assets/images/vertigo-rooftop-restaurant.jpg')}
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
    height: 100,
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
      paddingTop: 16,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 36,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.redwine,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4a4a4a',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 15,
    color: '#1a1a1a',
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
    borderTopColor: '#eee',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redwine,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: COLORS.redwine,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
