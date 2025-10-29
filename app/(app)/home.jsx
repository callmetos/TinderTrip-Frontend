import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Image, Text, TouchableOpacity, View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

// Constants
const INITIAL_PAGE = 1;
const PAGE_LIMIT = 20;
const PRELOAD_THRESHOLD = 3; // โหลดข้อมูลใหม่เมื่อเหลือ 3 การ์ด

// Memoized Card Component
const Card = memo(({ event }) => {
  return (
    <View style={styles.cardContainer}>
      {event?.cover_image_url ? (
        <Image
          source={{ uri: event.cover_image_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event?.title}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {event?.description}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {event?.address_text}
        </Text>
      </View>
    </View>
  );
});

Card.displayName = 'Card';

export default function Home() {
  const swiperRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGE);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchEvents(INITIAL_PAGE, false);
  }, []);

  const fetchEvents = async (page = INITIAL_PAGE, append = false) => {
    try {
      if (!append) setLoading(true);
      else setIsLoadingMore(true);

      setError(null);

      const res = await api.get('/api/v1/events', {
        params: { page, limit: PAGE_LIMIT, status: 'published' },
      });

      const data = res?.data?.data || [];
      const meta = res?.data?.meta;

      // Determine hasMore using meta if available, else by page size
      if (meta && typeof meta.total_pages === 'number') {
        setHasMore(page < meta.total_pages);
      } else {
        setHasMore(data.length === PAGE_LIMIT);
      }

      setEvents((prev) => (append ? [...prev, ...data] : data));
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setError('Failed to load events. Please try again.');

      if (!append) {
        Alert.alert('Error', 'Failed to load events. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Map swipe direction to backend expected payload
  const postSwipe = useCallback(async (eventId, direction) => {
    try {
      const apiDirection = direction === 'right' ? 'like' : 'pass';
      await api.post(`/api/v1/events/${eventId}/swipe`, {
        event_id: eventId,
        direction: apiDirection,
      });
    } catch (err) {
      console.error(`Failed to send ${direction} swipe`, err);
      const status = err?.response?.status;
      if (status === 400) {
        Alert.alert('Action not allowed', err?.response?.data?.message || 'Invalid swipe action.');
      } else if (status === 401) {
        Alert.alert('Unauthorized', 'Please login again.');
      } else {
        // non-blocking
      }
    }
  }, []);

  const handleSwipe = useCallback(
    async (cardIndex, direction) => {
      const event = events[cardIndex];
      if (!event) return;

      // fire and forget swipe
      postSwipe(event.id, direction);

      // preload next page when nearing the end
      const remainingCards = events.length - cardIndex - 1;
      if (remainingCards <= PRELOAD_THRESHOLD && hasMore && !isLoadingMore) {
        fetchEvents(currentPage + 1, true);
      }
    },
    [events, currentPage, hasMore, isLoadingMore, postSwipe]
  );

  const onSwipedLeft = useCallback(
    (cardIndex) => {
      setCurrentIndex(cardIndex + 1);
      handleSwipe(cardIndex, 'left');
    },
    [handleSwipe]
  );

  const onSwipedRight = useCallback(
    (cardIndex) => {
      setCurrentIndex(cardIndex + 1);
      handleSwipe(cardIndex, 'right');
    },
    [handleSwipe]
  );

  const onSwipedAll = useCallback(() => {
    if (hasMore) {
      fetchEvents(currentPage + 1, true);
    }
  }, [hasMore, currentPage]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    fetchEvents(INITIAL_PAGE, false);
  }, []);

  // Loading State
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  // Error State
  if (error && !events.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>😕</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No Events State
  if (!events.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyText}>No events available</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // All Cards Swiped
  if (currentIndex >= events.length && !hasMore) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🎊</Text>
        <Text style={styles.emptyText}>You've seen all events!</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Card Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {events.length}
          {isLoadingMore && ' (loading more...)'}
        </Text>
      </View>

      {/* Swiper */}
      <View style={styles.swiperContainer}>
        <View style={styles.swiperWrapper}>
          <Swiper
            ref={swiperRef}
            cards={events}
            cardIndex={currentIndex}
            renderCard={(card) => (card ? <Card event={card} /> : null)}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
            onSwipedAll={onSwipedAll}
            stackSize={3}
            backgroundColor="transparent"
            animateCardOpacity
            verticalSwipe={false}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            overlayLabels={{
              left: {
                title: 'NOPE',
                style: {
                  label: {
                    backgroundColor: '#FF4458',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    padding: 10,
                    borderRadius: 8,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    marginTop: 20,
                    marginLeft: -20,
                  },
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: {
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    fontSize: 24,
                    fontWeight: 'bold',
                    padding: 10,
                    borderRadius: 8,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 20,
                    marginLeft: 20,
                  },
                },
              },
            }}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => swiperRef.current?.swipeLeft()}
          style={[styles.actionButton, styles.dislikeButton]}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonEmoji}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => swiperRef.current?.swipeRight()}
          style={[styles.actionButton, styles.likeButton]}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonEmoji}>♥</Text>
        </TouchableOpacity>
      </View>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.redwine} />
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  counterText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  swiperContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swiperWrapper: {
    width: '100%',
    height: 440,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#eee',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    height: 420,
  },
  cardImage: {
    width: '100%',
    height: 260,
  },
  placeholderImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    color: '#666',
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  cardAddress: {
    color: COLORS.textLight,
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dislikeButton: {
    backgroundColor: '#FFE5E5',
  },
  likeButton: {
    backgroundColor: '#E5FFE5',
  },
  buttonEmoji: {
    fontSize: 32,
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    color: COLORS.textLight,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.redwine,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  reloadButton: {
    backgroundColor: COLORS.redwine,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
});
