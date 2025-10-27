import { useRouter } from "expo-router";
import { useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setupStep } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // มี authentication ตรวจสอบ setupStep
        if (setupStep === 'completed') {
          // เสร็จสิ้น setup แล้ว ให้ไปหน้า myapp
          console.log('Setup completed, redirecting to myapp');
          router.replace('/myapp');
        } else {
          // ยังไม่เสร็จสิ้น setup ให้ไปหน้า welcome
          console.log('Setup pending, redirecting to welcome');
          router.replace('/welcome');
        }
      } else {
        // ไม่มี authentication ให้ไปหน้า login
        console.log('User is not authenticated, redirecting to login');
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, setupStep, router]);

  // ไม่ต้องแสดงอะไร เพราะจะ redirect ทันที
  return null;
}