import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BADGE_COUNT_KEY = 'NOTIFICATION_BADGE_COUNT';
const NOTIFICATION_SETTINGS_KEY = 'NOTIFICATION_SETTINGS';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }
    
    // For Android, create notification channels for different types
    if (Platform.OS === 'android') {
      // Chat messages channel
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5A1D1D',
        sound: 'default',
        description: 'Notifications for new chat messages',
      });
      
      // Event updates channel
      await Notifications.setNotificationChannelAsync('event-updates', {
        name: 'Event Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#5A1D1D',
        sound: 'default',
        description: 'Notifications for event updates and reminders',
      });
      
      // Join requests channel
      await Notifications.setNotificationChannelAsync('join-requests', {
        name: 'Join Requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#5A1D1D',
        sound: 'default',
        description: 'Notifications for new join requests',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Show a local notification for a new chat message
 */
export async function showMessageNotification(message, eventTitle, eventId, roomId) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.chatMessages) {
      console.log('Chat message notifications are disabled');
      return;
    }

    const senderName = message.sender?.display_name || 
                       message.sender?.full_name || 
                       message.sender?.email?.split('@')[0] || 
                       'Someone';
    
    // Truncate long messages
    const messageBody = message.body.length > 100 
      ? message.body.substring(0, 97) + '...' 
      : message.body;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${eventTitle || 'Event Chat'}`,
        body: `${senderName}: ${messageBody}`,
        sound: settings.sound ? 'default' : null,
        data: {
          type: 'chat_message',
          messageId: message.id,
          roomId: roomId || message.room_id,
          eventId: eventId,
          eventTitle: eventTitle,
          senderId: message.sender_id,
          senderName: senderName,
        },
        categoryIdentifier: 'chat',
        badge: await incrementBadgeCount(),
      },
      trigger: null, // Show immediately
    });

    console.log(`Notification sent for message from ${senderName}`);
  } catch (error) {
    console.error('Error showing message notification:', error);
  }
}

/**
 * Show notification for event updates
 */
export async function showEventUpdateNotification(eventTitle, updateMessage, eventId) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.eventUpdates) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: eventTitle,
        body: updateMessage,
        sound: settings.sound ? 'default' : null,
        data: {
          type: 'event_update',
          eventId: eventId,
          eventTitle: eventTitle,
        },
        categoryIdentifier: 'event',
        badge: await incrementBadgeCount(),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing event update notification:', error);
  }
}

/**
 * Show notification for new join request
 */
export async function showJoinRequestNotification(userName, eventTitle, eventId) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.joinRequests) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Join Request',
        body: `${userName} wants to join "${eventTitle}"`,
        sound: settings.sound ? 'default' : null,
        data: {
          type: 'join_request',
          eventId: eventId,
          eventTitle: eventTitle,
          userName: userName,
        },
        categoryIdentifier: 'join',
        badge: await incrementBadgeCount(),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing join request notification:', error);
  }
}

/**
 * Show notification for event reminder
 */
export async function scheduleEventReminder(eventTitle, eventDate, eventId, hoursBeforeEvent = 24) {
  try {
    const settings = await getNotificationSettings();
    if (!settings.eventReminders) {
      return;
    }

    const eventTime = new Date(eventDate);
    const reminderTime = new Date(eventTime.getTime() - (hoursBeforeEvent * 60 * 60 * 1000));
    
    // Only schedule if reminder is in the future
    if (reminderTime > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Event Reminder',
          body: `"${eventTitle}" is happening in ${hoursBeforeEvent} hours!`,
          sound: settings.sound ? 'default' : null,
          data: {
            type: 'event_reminder',
            eventId: eventId,
            eventTitle: eventTitle,
          },
          categoryIdentifier: 'event',
          badge: await incrementBadgeCount(),
        },
        trigger: {
          date: reminderTime,
        },
      });
      
      console.log(`Scheduled reminder for ${eventTitle} at ${reminderTime}`);
    }
  } catch (error) {
    console.error('Error scheduling event reminder:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    console.log('All notifications canceled');
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Cancel notifications for a specific event
 */
export async function cancelEventNotifications(eventId) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduled) {
      if (notification.content.data?.eventId === eventId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    console.log(`Canceled notifications for event ${eventId}`);
  } catch (error) {
    console.error('Error canceling event notifications:', error);
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount() {
  try {
    const storedCount = await AsyncStorage.getItem(BADGE_COUNT_KEY);
    return storedCount ? parseInt(storedCount, 10) : 0;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
    await AsyncStorage.setItem(BADGE_COUNT_KEY, count.toString());
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Increment badge count
 */
export async function incrementBadgeCount() {
  try {
    const currentCount = await getBadgeCount();
    const newCount = currentCount + 1;
    await setBadgeCount(newCount);
    return newCount;
  } catch (error) {
    console.error('Error incrementing badge count:', error);
    return 1;
  }
}

/**
 * Reset badge count to zero
 */
export async function clearBadgeCount() {
  try {
    await setBadgeCount(0);
    await Notifications.dismissAllNotificationsAsync();
    console.log('Badge count cleared');
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
}

/**
 * Get notification settings
 */
export async function getNotificationSettings() {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    
    // Default settings
    return {
      chatMessages: true,
      eventUpdates: true,
      joinRequests: true,
      eventReminders: true,
      sound: true,
      vibration: true,
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      chatMessages: true,
      eventUpdates: true,
      joinRequests: true,
      eventReminders: true,
      sound: true,
      vibration: true,
    };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    console.log('Notification settings updated:', settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
  }
}

/**
 * Handle notification response (when user taps on notification)
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Handle notification received while app is in foreground
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

