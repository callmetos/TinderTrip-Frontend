import { Platform } from 'react-native';

// ตรวจสอบว่าเป็น web หรือ mobile
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

// ฟังก์ชันสำหรับ switch case
export const getPlatform = () => {
  return Platform.OS === 'web' ? 'web' : 'mobile';
};

// ตัวอย่างการใช้งาน
// if (isWeb) {
//   // ทำอะไรสำหรับ web
// } else {
//   // ทำอะไรสำหรับ mobile
// }

// หรือใช้ switch case
// switch (getPlatform()) {
//   case 'web':
//     // ทำอะไรสำหรับ web
//     break;
//   case 'mobile':
//     // ทำอะไรสำหรับ mobile
//     break;
// }
