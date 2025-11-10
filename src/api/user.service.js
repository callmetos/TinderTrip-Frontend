import { api } from './client.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Get user statistics by fetching from existing event endpoints
 * This avoids needing a new backend endpoint
 */
export async function getUserStats() {
  try {
    const stats = {
      events_joined: 0,
      events_liked: 0,
      events_created: 0,
    };

    // Get current user ID from storage
    let currentUserId = null;
    try {
      const userData = await AsyncStorage.getItem('USER_DATA');
      if (userData) {
        const user = JSON.parse(userData);
        currentUserId = user.id || user.user_id;
      }
    } catch (err) {
      if (__DEV__) console.warn('Failed to get user ID:', err);
    }

    // Get events joined
    try {
      const joinedRes = await api.get('/api/v1/events/joined', {
        params: { page: 1, limit: 1000 }, // High limit to get all
      });
      const joinedEvents = joinedRes?.data?.data || [];
      stats.events_joined = joinedEvents.length;
      
      // Events liked = events joined that user didn't create
      // (since swipe right auto-joins the event)
      if (currentUserId) {
        stats.events_liked = joinedEvents.filter(event => 
          event.creator_id !== currentUserId && event.creator?.id !== currentUserId
        ).length;
      } else {
        stats.events_liked = joinedEvents.length; // Fallback if no user ID
      }
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch joined events count:', err);
    }

    // Get all events to count created
    if (currentUserId) {
      try {
        const allEventsRes = await api.get('/api/v1/events', {
          params: { page: 1, limit: 1000 },
        });
        const allEvents = allEventsRes?.data?.data || [];
        
        // Count events created by current user
        stats.events_created = allEvents.filter(event => 
          event.creator_id === currentUserId || event.creator?.id === currentUserId
        ).length;
        
      } catch (err) {
        if (__DEV__) console.warn('Failed to fetch all events:', err);
      }
    }

    return stats;
  } catch (err) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to get user statistics";
    const e = new Error(message);
    e.status = err?.response?.status;
    e.response = err?.response;
    throw e;
  }
}
