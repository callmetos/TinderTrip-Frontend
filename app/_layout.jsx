import SafeScreen from "@/components/SafeScreen";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/contexts/AuthContext";
import { useEffect, useRef } from 'react';
import { AppState, ActivityIndicator, View, Text as RNText, TextInput as RNTextInput } from 'react-native';
import { 
  requestNotificationPermissions, 
  clearBadgeCount,
  addNotificationResponseListener 
} from '../src/utils/notifications';
import { useFonts } from 'expo-font';
import { 
  Prompt_300Light,
  Prompt_400Regular,
  Prompt_500Medium,
  Prompt_600SemiBold,
  Prompt_700Bold,
} from '@expo-google-fonts/prompt';
import { COLORS } from '@/color/colors';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef(null);
  const [fontsLoaded] = useFonts({
    Prompt_300Light,
    Prompt_400Regular,
    Prompt_500Medium,
    Prompt_600SemiBold,
    Prompt_700Bold,
  });

  useEffect(() => {
    // Request notification permissions on app start
    requestNotificationPermissions();

    // Setup notification response listener
    notificationListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification response received:', data);
      
      // The actual navigation will be handled by individual screens
      // This is just for logging and potential global actions
    });

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - clear badge
        console.log('App came to foreground');
        clearBadgeCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, []);

  // Apply global default font once loaded
  useEffect(() => {
    if (fontsLoaded) {
      // Set default props for Text
      const TextRender = RNText.render;
      const TextInputRender = RNTextInput.render;
      
      RNText.render = function (props, ref) {
        return TextRender.call(this, {
          ...props,
          style: [{ fontFamily: 'Prompt_400Regular' }, props.style]
        }, ref);
      };

      RNTextInput.render = function (props, ref) {
        return TextInputRender.call(this, {
          ...props,
          style: [{ fontFamily: 'Prompt_400Regular' }, props.style]
        }, ref);
      };
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.redwine} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <SafeScreen>
        <Slot />
        <StatusBar style="light" backgroundColor={COLORS.redwine} />
      </SafeScreen>
    </AuthProvider>
  );
}

