import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { roomId, eventId, eventTitle, from } = params;
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    fetchEventData();
  }, []);

  useEffect(() => {
    if (roomId) {
      console.log('Chat Room - Loading room:', roomId, 'Event:', eventTitle);
      fetchMessages();
    }
  }, [roomId]);

  const handleGoBack = () => {
    if (from) {
      // Go back to specific tab
      router.replace(`/${from}`);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/messages');
    }
  };

  const loadCurrentUser = async () => {
    try {
      // Try USER_DATA first (main key used in AuthContext)
      let userStr = await AsyncStorage.getItem('USER_DATA');
      if (!userStr) {
        // Fallback to 'user' for compatibility
        userStr = await AsyncStorage.getItem('user');
      }
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        console.log('Current user ID loaded:', user.id);
      } else {
        console.warn('No user data found in AsyncStorage');
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      console.log('Fetching event data:', eventId);
      const response = await api.get(`/api/v1/events/${eventId}`);
      console.log('Full API response:', JSON.stringify(response, null, 2));
      
      // Check if data is nested or direct
      const eventData = response.data?.data || response.data;
      setEventData(eventData);
      
      console.log('Event data loaded:', eventData);
      console.log('Member count:', eventData.member_count);
      console.log('Capacity:', eventData.capacity);
      console.log('Members array:', eventData.members);
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

  const fetchMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      console.log('Fetching messages for room:', roomId, 'page:', pageNum);
      const response = await api.get(`/api/v1/chat/rooms/${roomId}/messages`, {
        params: {
          page: pageNum,
          limit: 50,
        }
      });
      
      const newMessages = response.data.messages || [];
      console.log('Received messages:', newMessages.length);
      
      if (pageNum === 1) {
        setMessages(newMessages.reverse());
      } else {
        setMessages([...newMessages.reverse(), ...messages]);
      }
      
      setHasMore(newMessages.length === 50);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
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

      // Add new message to list
      setMessages([...messages, response.data]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
      setMessageText(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    // On web, send message when Enter is pressed without Shift
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateHeader = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    
    return currentDate !== previousDate;
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    const previousMsg = index > 0 ? messages[index - 1] : null;
    const showDateHeader = shouldShowDateHeader(item, previousMsg);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(item.created_at)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft
        ]}>
          {!isCurrentUser && (
            <Text style={styles.senderName}>
              {item.sender?.full_name || item.sender?.email || 'Unknown'}
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
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={60} color={COLORS.textLight} />
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Be the first to say hello!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
        >
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
          onPress={() => {
            if (eventId) {
              router.push({
                pathname: '/event-details',
                params: {
                  id: eventId,
                  from: 'chat-room'
                }
              });
            }
          }}
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
                  const spotsLeft = Math.max(0, capacity - confirmedCount);
                  
                  return `${confirmedCount}/${capacity} Will go`;
                })()}
              </Text>
              <Text style={styles.spotsLeft}>
                {(() => {
                  const confirmedCount = eventData.members?.filter(m => m.status === 'confirmed').length || eventData.member_count || 0;
                  const capacity = eventData.capacity || 0;
                  const spotsLeft = Math.max(0, capacity - confirmedCount);
                  
                  return `• ${spotsLeft} spots left`;
                })()}
              </Text>
            </View>

            {/* Only show button if not creator and not already joined */}
            {!eventData.is_joined && currentUserId !== eventData.creator_id && (
              <TouchableOpacity 
                style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
                onPress={handleConfirmAttendance}
                disabled={confirming}
              >
                {confirming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    I'll going
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Show confirmed status */}
            {(eventData.is_joined || currentUserId === eventData.creator_id) && (
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.redwine} />
                <Text style={styles.confirmedText}>
                  {currentUserId === eventData.creator_id ? "You're Creator" : "You're will going"}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Messages List */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.redwine} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList
            ]}
            ListEmptyComponent={renderEmpty}
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
              onKeyPress={handleKeyPress}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: COLORS.textLight,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
});
