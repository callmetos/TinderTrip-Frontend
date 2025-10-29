import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

export default function LikedScreen() {
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLikedEvents();
  }, []);

  const fetchLikedEvents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual endpoint when backend is ready
      // const res = await api.get('/api/v1/users/swipes?direction=like');
      // For now, fetch all events and filter (temporary)
      const res = await api.get('/api/v1/events', {
        params: { page: 1, limit: 50, status: 'published' },
      });
      
      // TODO: Filter only liked events when user_swipe data is available
      const events = res?.data?.data || [];
      setLikedEvents(events.slice(0, 10)); // Temporary: show first 10
    } catch (err) {
      console.error('Failed to fetch liked events', err);
      Alert.alert('Error', 'Failed to load liked events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedEvents();
  };

  const handleJoinEvent = async (eventId) => {
    try {
      await api.post(`/api/v1/events/${eventId}/join`);
      Alert.alert('Success', 'You have joined this event!');
      // Refresh to update join status
      fetchLikedEvents();
    } catch (err) {
      console.error('Failed to join event', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to join event');
    }
  };

  const renderEventCard = ({ item }) => (
    <View style={styles.card}>
      {item.cover_image_url ? (
        <Image source={{ uri: item.cover_image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      )}
      
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.metaRow}>
          <Ionicons name="location" size={14} color={COLORS.textLight} />
          <Text style={styles.metaText} numberOfLines={1}>{item.address_text}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={() => handleJoinEvent(item.id)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.buttonText}>Join Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.viewButton]}>
            <Text style={[styles.buttonText, { color: COLORS.redwine }]}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={styles.loadingText}>Loading liked events...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liked Events</Text>
        <Text style={styles.headerSubtitle}>Events you're interested in</Text>
      </View>

      {likedEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No liked events yet</Text>
          <Text style={styles.emptySubtext}>Start swiping to find events you like!</Text>
        </View>
      ) : (
        <FlatList
          data={likedEvents}
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
  listContent: {
    padding: 16,
    paddingTop: 8,
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
    height: 180,
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
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  joinButton: {
    backgroundColor: COLORS.redwine,
  },
  viewButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.redwine,
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
