# 🔔 Notification System - TinderTrip

## Overview
ระบบ notification แบบครบเซ็ตสำหรับ TinderTrip Mobile App รองรับทั้ง iOS และ Android

## ✨ Features

### 📱 Notification Types
1. **Chat Messages** - แจ้งเตือนข้อความใหม่ในห้องแชท
2. **Event Updates** - อัพเดทเกี่ยวกับอีเวนต์ที่เข้าร่วม
3. **Join Requests** - มีคนขอเข้าร่วมอีเวนต์ของคุณ
4. **Event Reminders** - เตือนก่อนอีเวนต์เริ่ม

### 🎯 Smart Features
- ✅ **Auto Badge Count** - นับจำนวน notification อัตโนมัติ
- ✅ **Deep Linking** - กด notification แล้วเปิดไปหน้าที่เกี่ยวข้องทันที
- ✅ **Smart Detection** - ไม่แจ้งเตือนข้อความจากตัวเอง
- ✅ **Background/Foreground Aware** - แจ้งเตือนเฉพาะตอนแอพอยู่ background
- ✅ **Auto Clear Badge** - ล้าง badge อัตโนมัติเมื่อเปิดแอพ
- ✅ **Customizable Settings** - ปรับการแจ้งเตือนได้ตามใจ
- ✅ **Multiple Channels** (Android) - แยก channel ตามประเภท notification

## 📋 Installation

```bash
cd TinderTrip-Frontend
npx expo install expo-notifications
```

## 🔧 Configuration Files

### 1. Notification Utility (`src/utils/notifications.js`)
```javascript
import { 
  requestNotificationPermissions,
  showMessageNotification,
  showEventUpdateNotification,
  showJoinRequestNotification,
  scheduleEventReminder,
  clearBadgeCount,
  getNotificationSettings,
  updateNotificationSettings
} from '@/src/utils/notifications';
```

### 2. App Configuration (`app.json`)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#5A1D1D",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

## 🚀 Usage Examples

### Chat Room - Real-time Notifications
```javascript
// In chat-room.jsx
useEffect(() => {
  if (uniqueNewMessages.length > 0) {
    uniqueNewMessages.forEach(msg => {
      if (msg.sender_id !== currentUserId && !isAppInForeground) {
        showMessageNotification(msg, eventTitle, eventId, roomId);
      }
    });
  }
}, [messages]);
```

### Event Updates
```javascript
// When event is updated
await showEventUpdateNotification(
  "Beach Party 2025",
  "Event location has been changed",
  eventId
);
```

### Join Requests
```javascript
// When someone wants to join
await showJoinRequestNotification(
  "John Doe",
  "Mountain Hiking Trip",
  eventId
);
```

### Event Reminders
```javascript
// Schedule reminder 24 hours before event
await scheduleEventReminder(
  "Concert Night",
  eventDate,
  eventId,
  24 // hours before
);
```

### Handle Notification Tap
```javascript
// Automatically handled in app/_layout.jsx and chat-room.jsx
const responseListener = addNotificationResponseListener(response => {
  const { type, eventId, roomId } = response.notification.request.content.data;
  
  if (type === 'chat_message') {
    router.push(`/chat-room?roomId=${roomId}`);
  } else if (type === 'event_update') {
    router.push(`/event-details?id=${eventId}`);
  }
});
```

### Manage Badge Count
```javascript
// Clear badge
await clearBadgeCount();

// Get current count
const count = await getBadgeCount();

// Set specific count
await setBadgeCount(5);
```

## ⚙️ Notification Settings

Users can customize notifications in **Notification Settings** screen (`/notification-settings`):

- Enable/Disable each notification type
- Toggle sound
- Toggle vibration
- Clear badge count
- Clear all notifications

## 🎨 Notification Channels (Android)

### Chat Messages
- **Importance:** HIGH
- **Sound:** ✅
- **Vibration:** 250ms pattern
- **LED Color:** #5A1D1D

### Event Updates
- **Importance:** DEFAULT
- **Sound:** ✅
- **Vibration:** 200ms pattern
- **LED Color:** #5A1D1D

### Join Requests
- **Importance:** HIGH
- **Sound:** ✅
- **Vibration:** 300-200-300ms pattern
- **LED Color:** #5A1D1D

## 📊 Data Structure

### Notification Data
```javascript
{
  type: 'chat_message' | 'event_update' | 'join_request' | 'event_reminder',
  messageId: string,
  roomId: string,
  eventId: string,
  eventTitle: string,
  senderId: string,
  senderName: string,
  // ... other relevant data
}
```

### Settings Object
```javascript
{
  chatMessages: boolean,
  eventUpdates: boolean,
  joinRequests: boolean,
  eventReminders: boolean,
  sound: boolean,
  vibration: boolean
}
```

## 🧪 Testing

### iOS
- **Simulator:** Notifications จะไม่แสดง (limitation ของ Apple)
- **Real Device:** ทดสอบได้ปกติ

### Android
- **Emulator:** ทดสอบได้ปกติ
- **Real Device:** ทดสอบได้ปกติ

### Test Scenarios
1. ส่งข้อความในแชท (background) → ควรได้ notification
2. มีคนส่งข้อความ (foreground) → ไม่ควรมี notification
3. กด notification → ควรเปิดไปหน้าที่ถูกต้อง
4. เปิดแอพ → badge count ควรเคลียร์
5. ปิดการแจ้งเตือนใน settings → ไม่ควรได้ notification

## 🐛 Troubleshooting

### Permission Issues
```javascript
// Check permission status
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);

// Request again if needed
if (status !== 'granted') {
  await requestNotificationPermissions();
}
```

### Notifications Not Showing
1. ตรวจสอบ permission
2. ตรวจสอบ settings (ผู้ใช้อาจปิดไว้)
3. ตรวจสอบว่าแอพอยู่ background
4. ตรวจสอบ logs

### Badge Count Issues
```javascript
// Force reset badge
await clearBadgeCount();
await AsyncStorage.removeItem('NOTIFICATION_BADGE_COUNT');
```

## 📱 Screens

### 1. Chat Room (`/chat-room`)
- Real-time message notifications
- Auto-clear badge when active
- Deep link support

### 2. Notification Settings (`/notification-settings`)
- Toggle notification types
- Sound/vibration settings
- Clear actions
- Info guide

### 3. App Root (`/_layout`)
- Global notification listener
- Auto badge clearing
- Permission request on startup

## 🔄 Future Enhancements

- [ ] Custom notification sounds per event
- [ ] Group notifications by event
- [ ] Rich notifications with images
- [ ] Action buttons in notifications (Reply, Mark as Read)
- [ ] Notification history screen
- [ ] Do Not Disturb mode
- [ ] Scheduled quiet hours
- [ ] Push notifications from server (FCM)

## 📝 Notes

- Notifications ใช้ **local notifications** ไม่ใช่ push notifications จาก server
- Badge count เก็บใน AsyncStorage เพื่อ persistence
- Settings เก็บใน AsyncStorage
- Support ทั้ง iOS และ Android
- Optimized สำหรับ battery life (polling 3 วินาที)

## 🤝 Contributing

ถ้าต้องการเพิ่มฟีเจอร์:
1. เพิ่มฟังก์ชันใน `src/utils/notifications.js`
2. เพิ่ม channel ใหม่ (Android) ถ้าจำเป็น
3. อัพเดท notification settings screen
4. อัพเดท README นี้

---

Made with ❤️ for TinderTrip
