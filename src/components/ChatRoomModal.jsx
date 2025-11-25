import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal,
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Keyboard,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { api } from '../api/client.js';
import { COLORS } from '@/color/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatRoomModal({ visible, onClose, roomId, eventId: propEventId, eventTitle: propEventTitle }) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [eventId, setEventId] = useState(propEventId);
  const [eventTitle, setEventTitle] = useState(propEventTitle);
  const [previousConfirmedCount, setPreviousConfirmedCount] = useState(0);
  const [confirmedUserIds, setConfirmedUserIds] = useState(new Set());
  
  const flatListRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const pollingIntervalRef = useRef(null);

  // Slide in/out animation when modal visibility changes
  useEffect(() => {
    if (visible) {
      // Reset translateX and animate in from right to left
      translateX.setValue(0);
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Fetch data when modal opens
  useEffect(() => {
    if (visible && roomId) {
      if (user?.id) {
        setCurrentUserId(user.id);
        console.log('ChatRoomModal - Current user ID:', user.id);
      }
      fetchMessages();
      if (eventId) {
        console.log('ChatRoomModal - Fetching event data for eventId:', eventId);
        fetchEventData();
      } else {
        console.log('ChatRoomModal - No eventId available');
      }
    }
  }, [visible, roomId, eventId, user]);

  // Real-time message polling (every 2 seconds)
  useEffect(() => {
    if (visible && roomId) {
      console.log('🔄 Starting message polling...');
      
      // Poll every 2 seconds for new messages
      pollingIntervalRef.current = setInterval(() => {
        fetchMessagesQuietly();
        // Also poll event data to detect new confirmations
        if (eventId) {
          fetchEventData();
        }
      }, 2000);

      return () => {
        // Cleanup: stop polling when modal closes
        if (pollingIntervalRef.current) {
          console.log('⏹️ Stopping message polling');
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [visible, roomId, eventId, confirmedUserIds]);

  // Handle swipe gesture
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX: swipeDistance, velocityX } = nativeEvent;
      const threshold = SCREEN_WIDTH / 2;
      
      const shouldClose = velocityX > 800 || swipeDistance > threshold;
      
      if (shouldClose) {
        // Animate out from left to right before closing
        const currentPosition = slideAnim._value + translateX._value;
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH - translateX._value,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          translateX.setValue(0);
          slideAnim.setValue(SCREEN_WIDTH);
          onClose();
        });
      } else {
        // Reset position with spring animation
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
          velocity: -velocityX / 100,
        }).start();
      }
    } else if (nativeEvent.state === State.BEGAN) {
      translateX.setValue(0);
    }
  };

  // Handle back button press with animation
  const handleClose = () => {
    // Animate out from left to right
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      slideAnim.setValue(SCREEN_WIDTH);
      onClose();
    });
  };

  // Handle info button press - navigate to event details
  const handleInfoPress = () => {
    if (eventId) {
      console.log('Navigating to event-details from ChatRoomModal with id:', eventId);
      // Close modal first
      handleClose();
      // Small delay to ensure modal is closed before navigation
      setTimeout(() => {
        router.push({
          pathname: '/event-details',
          params: {
            id: eventId,
            from: 'messages'
          }
        });
      }, 350); // Match animation duration
    } else {
      console.warn('eventId is undefined, cannot navigate to event-details');
      Alert.alert('Error', 'Event information not available');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/chat/rooms/${roomId}/messages`, {
        params: { page: 1, limit: 50 }
      });
      
      const newMessages = response.data.messages || [];
      setMessages(newMessages.reverse());
      
      if (newMessages.length > 0) {
        lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages quietly (for polling - no loading indicator)
  const fetchMessagesQuietly = async () => {
    try {
      const response = await api.get(`/api/v1/chat/rooms/${roomId}/messages`, {
        params: { page: 1, limit: 50 }
      });
      
      const newMessages = response.data.messages || [];
      const reversedMessages = newMessages.reverse();
      
      // Smart update: only update if there are actual new messages
      setMessages(prevMessages => {
        const prevLength = prevMessages.length;
        const newLength = reversedMessages.length;
        
        // Check if there are new messages
        if (newLength > prevLength) {
          const newCount = newLength - prevLength;
          console.log(`📨 ${newCount} new message(s) received`);
          
          // Auto-scroll to bottom when new messages arrive
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          
          return reversedMessages;
        }
        
        // Check if latest message changed (edited/deleted)
        if (newLength > 0 && prevLength > 0) {
          const latestNew = reversedMessages[newLength - 1];
          const latestPrev = prevMessages[prevLength - 1];
          
          if (latestNew?.id !== latestPrev?.id || 
              latestNew?.body !== latestPrev?.body) {
            console.log('✏️ Message updated');
            return reversedMessages;
          }
        }
        
        // No changes, return previous state
        return prevMessages;
      });
      
      if (reversedMessages.length > 0) {
        lastMessageIdRef.current = reversedMessages[reversedMessages.length - 1].id;
      }
    } catch (err) {
      // Fail silently for polling
      console.error('Polling error:', err.message);
    }
  };

  const fetchEventData = async () => {
    try {
      console.log('ChatRoomModal - Fetching event details for eventId:', eventId);
      const response = await api.get(`/api/v1/events/${eventId}`);
      const data = response.data?.data || response.data;
      
      // Calculate confirmed count and get member details
      const confirmedMembers = data.members?.filter(m => m.status === 'confirmed') || [];
      const currentConfirmedCount = confirmedMembers.length || data.member_count || 0;
      
      // Check if someone new confirmed by comparing user IDs
      const currentConfirmedUserIds = new Set(confirmedMembers.map(m => m.user_id));
      
      // Find newly confirmed users (not in previous set)
      const newlyConfirmedUsers = confirmedMembers.filter(
        member => !confirmedUserIds.has(member.user_id)
      );
      
      // Only send notifications if we have previous data and there are new confirmations
      // AND it's not the current user (to avoid duplicate when user confirms themselves)
      if (confirmedUserIds.size > 0 && newlyConfirmedUsers.length > 0) {
        console.log(`✅ ${newlyConfirmedUsers.length} new confirmation(s) detected!`);
        
        // Send notification to chat history for each new confirmation
        for (const member of newlyConfirmedUsers) {
          // Skip if it's the current user (already sent in handleConfirmAttendance)
          if (String(member.user_id) === String(currentUserId)) {
            console.log('Skipping notification for current user');
            continue;
          }
          
          const userName = member.user?.display_name || member.user?.full_name || member.user?.username || 'Someone';
          
          try {
            const notificationBody = `${userName} confirmed attendance! 🎉`;
            
            await api.post(`/api/v1/chat/rooms/${roomId}/messages`, {
              room_id: roomId,
              body: notificationBody
            });
            
            console.log(`✅ Sent notification to chat history for: ${userName}`);
          } catch (chatErr) {
            console.error('Failed to send notification to chat:', chatErr);
            console.error('Error details:', chatErr.response?.data);
            // Continue with other notifications even if one fails
          }
        }
      }
      
      // Update confirmed user IDs set for next comparison
      setConfirmedUserIds(currentConfirmedUserIds);
      
      setEventData(data);
      console.log('ChatRoomModal - Event data loaded:', {
        title: data.title,
        creator_id: data.creator_id,
        is_joined: data.is_joined,
        member_count: data.member_count,
        capacity: data.capacity,
        members: data.members?.length,
        confirmed: currentConfirmedCount
      });
      console.log('ChatRoomModal - currentUserId:', currentUserId);
    } catch (err) {
      console.error('Failed to fetch event:', err);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!eventId || confirming) return;
    
    try {
      setConfirming(true);
      console.log('Confirming attendance for event:', eventId);
      
      await api.post(`/api/v1/events/${eventId}/confirm`);
      
      // Send system notification to chat history
      try {
        const userName = user?.display_name || user?.full_name || user?.username || 'Someone';
        const notificationBody = `${userName} confirmed attendance! 🎉`;
        
        await api.post(`/api/v1/chat/rooms/${roomId}/messages`, {
          room_id: roomId,
          body: notificationBody,
          message_type: 'text'
        });
        
        console.log('✅ Sent confirmation notification to chat history');
      } catch (chatErr) {
        console.error('Failed to send notification to chat:', chatErr);
        console.error('Error details:', chatErr.response?.data);
        // Don't block the confirm process if notification fails
      }
      
      // Refresh event data to get updated member count
      await fetchEventData();
      
      Alert.alert('Success', 'You confirmed your attendance!');
    } catch (err) {
      console.error('Failed to confirm attendance:', err);
      
      // Handle 409 conflict (already confirmed) gracefully
      if (err.response?.status === 409) {
        Alert.alert('Info', 'You have already confirmed this event');
        await fetchEventData(); // Refresh to show current status
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to confirm attendance');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const tempMessage = messageText;
    setMessageText('');

    try {
      setSending(true);
      const response = await api.post(`/api/v1/chat/rooms/${roomId}/messages`, {
        room_id: roomId,
        body: tempMessage,
        message_type: 'text',
      });

      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);
      lastMessageIdRef.current = newMessage.id;
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(tempMessage);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = String(item.sender_id) === String(currentUserId);
    const isSystemMessage = item.message_type === 'system_notification' || item.sender_id === 'system';
    
    // Render system notification differently
    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBadge}>
            <Ionicons name="checkmark-done-circle" size={16} color={COLORS.redwine} />
            <Text style={styles.systemMessageText}>{item.body}</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>
            {item.sender?.display_name || item.sender?.full_name || 'Unknown'}
          </Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.messageTextRight : styles.messageTextLeft
          ]}>
            {item.body}
          </Text>
        </View>
        
        <Text style={[
          styles.messageTime,
          isCurrentUser ? styles.messageTimeRight : styles.messageTimeLeft
        ]}>
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBackdrop}>
          <GestureHandlerRootView style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            activeOffsetX={10}
            failOffsetX={-5}
          >
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                shadowColor: '#000',
                shadowOffset: { width: -2, height: 0 },
                shadowOpacity: Animated.add(slideAnim, translateX).interpolate({
                  inputRange: [0, SCREEN_WIDTH],
                  outputRange: [0.3, 0],
                  extrapolate: 'clamp',
                }),
                shadowRadius: 10,
                elevation: 5,
                transform: [
                  { translateX: Animated.add(slideAnim, translateX) }
                ]
              }
            ]}
          >
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {eventTitle || 'Chat'}
                  </Text>
                  <Text style={styles.headerSubtitle}>Event Chat</Text>
                </View>

                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={handleInfoPress}
                >
                  <Ionicons name="information-circle-outline" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Event Confirmation Header */}
              {eventData && (
                <View style={styles.confirmationHeader}>
                  <View style={styles.confirmationContent}>
                    <Text style={styles.confirmationTitle}>Will you go?</Text>
                    
                    <View style={styles.memberStats}>
                      <Ionicons name="people" size={16} color={COLORS.textLight} />
                      <Text style={styles.memberStatsText}>
                        {(() => {
                          // Calculate confirmed members from members array
                          const confirmedCount = eventData.members?.filter(m => m.status === 'confirmed').length || eventData.member_count || 0;
                          const capacity = eventData.capacity || 0;
                          
                          return `${confirmedCount}/${capacity} Will go`;
                        })()}
                      </Text>
                      <Text style={styles.spotsLeft}>
                        {(() => {
                          const confirmedCount = eventData.members?.filter(m => m.status === 'confirmed').length || eventData.member_count || 0;
                          const capacity = eventData.capacity || 0;
                          const spotsLeft = Math.max(0, capacity - confirmedCount);
                          
                          return spotsLeft === 0 ? '• Full' : `• ${spotsLeft} spots left`;
                        })()}
                      </Text>
                    </View>

                    {/* Only show button if not creator and not already joined */}
                    {!eventData.is_joined && String(currentUserId) !== String(eventData.creator_id) && (() => {
                      const confirmedCount = eventData.members?.filter(m => m.status === 'confirmed').length || eventData.member_count || 0;
                      const capacity = eventData.capacity || 0;
                      const isFull = confirmedCount >= capacity;
                      
                      return (
                        <TouchableOpacity 
                          style={[
                            styles.confirmButton, 
                            (confirming || isFull) && styles.confirmButtonDisabled
                          ]}
                          onPress={handleConfirmAttendance}
                          disabled={confirming || isFull}
                        >
                          {confirming ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.confirmButtonText}>
                              {isFull ? 'Full' : "I'll going"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })()}

                    {/* Show confirmed status */}
                    {(eventData.is_joined || String(currentUserId) === String(eventData.creator_id)) && (
                      <View style={styles.confirmedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.redwine} />
                        <Text style={styles.confirmedText}>
                          {String(currentUserId) === String(eventData.creator_id) ? "You're Creator" : "You're will going"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Messages List */}
              <View style={styles.chatContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.redwine} />
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => {
                      if (messages.length > 0) {
                        flatListRef.current?.scrollToEnd({ animated: false });
                      }
                    }}
                  />
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Type a message..."
                      value={messageText}
                      onChangeText={setMessageText}
                      onSubmitEditing={handleSendMessage}
                      blurOnSubmit={false}
                      returnKeyType="send"
                      multiline
                      maxLength={1000}
                      placeholderTextColor="#999"
                    />
                    
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!messageText.trim() || sending) && styles.sendButtonDisabled
                      ]}
                      onPress={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
        </GestureHandlerRootView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  headerButton: {
    marginLeft: 12,
  },
  confirmationHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  confirmationContent: {
    alignItems: 'center',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberStatsText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 6,
  },
  spotsLeft: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.redwine,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 160,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#999',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  confirmedText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.redwine,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  messageBubbleLeft: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: COLORS.redwine,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextLeft: {
    color: '#333',
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
  },
  messageTimeLeft: {
    color: COLORS.textLight,
  },
  messageTimeRight: {
    color: COLORS.textLight,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.redwine,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.redwine + '20',
  },
  systemMessageText: {
    fontSize: 13,
    color: COLORS.redwine,
    fontWeight: '600',
  },
});
