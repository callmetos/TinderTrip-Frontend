import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { isMobile, isWeb } from './platform';

/**
 * Logout utility function with platform-specific confirmation
 * @param {Function} onConfirm - Callback function when user confirms logout
 * @param {Function} setShowModal - Function to show modal (for web)
 */
export const handleLogout = (onConfirm, setShowModal) => {
  if (isWeb) {
    // สำหรับ web - แสดง modal ยืนยัน
    setShowModal(true);
  } else if (isMobile) {
    // สำหรับ mobile - ใช้ Alert
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  }
};

/**
 * Perform actual logout - clear storage and navigate
 * @param {Function} router - Router instance for navigation
 */
export const performLogout = async (router) => {
  try {
    // ลบข้อมูลทั้งหมดจาก AsyncStorage
    await AsyncStorage.clear();
    router.replace('/login');
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Error', 'Failed to logout');
  }
};
