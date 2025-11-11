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
import { api } from '../api/client.js';
import { COLORS } from '@/color/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatRoomModal({ visible, onClose, roomId, eventId: propEventId, eventTitle: propEventTitle }) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [eventId, setEventId] = useState(propEventId);
  const [eventTitle, setEventTitle] = useState(propEventTitle);
  
  const flatListRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

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
      }
      fetchMessages();
      if (eventId) {
        fetchEventData();
      }
    }
  }, [visible, roomId, eventId, user]);

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

  const fetchEventData = async () => {
    try {
      const response = await api.get(`/api/v1/events/${eventId}`);
      const data = response.data?.data || response.data;
      setEventData(data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
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

                <TouchableOpacity style={styles.headerButton}>
                  <Ionicons name="information-circle-outline" size={24} color="#333" />
                </TouchableOpacity>
              </View>

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
});
