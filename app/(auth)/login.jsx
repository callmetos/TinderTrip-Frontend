import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { 
  ActivityIndicator,
  Image, 
  Keyboard,
  Platform, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';
import { getGoogleAuthUrl, login } from '../../src/api/auth.service.js';
import { Notification } from '../../src/utils/Notification.jsx';

// Constants
const STORAGE_KEYS = {
  TOKEN: 'TOKEN',
  USER_DATA: 'USER_DATA'
};

const getRedirectUrl = () => {
  return Platform.OS === 'web' 
    ? `${window.location.origin}/callback`
    : 'mobileapp://callback';
};

export default function LoginScreen() {
  const router = useRouter();
  const passwordRef = useRef(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Validation helpers
  const validateInputs = () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return false;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return false;
    }

    return true;
  };

  const onLoginPress = async () => {
    // Clear previous errors
    setError('');
    
    // Validate inputs
    if (!validateInputs()) return;

    // Dismiss keyboard
    Keyboard.dismiss();

    try {
      setLoading(true);
      
      const response = await login(email, password);
      
      if (__DEV__) {
        console.log('Login successful:', response);
      }
      
      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user))
      ]);
      
      // ใช้ replace และรอให้เสร็จสมบูรณ์
      setTimeout(() => {
        router.replace('/welcome');
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      
      // User-friendly error messages
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.userMessage 
        || 'Login failed. Please check your credentials and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      if (__DEV__) {
        console.log('Initiating Google OAuth...');
      }
      
      const response = await getGoogleAuthUrl();
      const redirectUrl = getRedirectUrl();
      
      // Create redirect URL for web browser
      const googleRedirectUrl = `${window.location.origin}/google-redirect?auth_url=${encodeURIComponent(response.auth_url)}`;
      
      if (__DEV__) {
        console.log('Opening Google OAuth...');
      }
      
      const result = await WebBrowser.openAuthSessionAsync(
        googleRedirectUrl,
        redirectUrl
      );
      
      if (result.type === 'success') {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const user_id = url.searchParams.get('user_id');
        const userEmail = url.searchParams.get('email');
        const display_name = url.searchParams.get('display_name');
        const provider = url.searchParams.get('provider');
        
        if (token) {
          // Store token and user data
          await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
          
          const userData = {
            id: user_id,
            email: userEmail,
            display_name: display_name,
            provider: provider
          };
          
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
          
          if (__DEV__) {
            console.log('Google OAuth successful');
          }
          
          router.replace('/welcome');
        } else {
          setError('Authentication failed. No token received.');
        }
      } else if (result.type === 'cancel') {
        if (__DEV__) {
          console.log('User cancelled Google authentication');
        }
      } else {
        setError('Google authentication failed. Please try again.');
      }
      
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Failed to connect with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          marginBottom: 20, 
          justifyContent: "center" 
        }}>
          <Image 
            source={require("../../assets/images/Login-page/logo.png")} 
            style={styles.logo} 
          />
          <Text style={styles.logoText}>TinderTrip</Text>
        </View>

        {/* Error Notification */}
        <Notification 
          type="error" 
          message={error} 
          onClose={() => setError('')} 
        />

        {/* Email Input */}
        <View>
          <Text style={{
            marginLeft: 50,
            padding: 8,
            fontWeight: "500",
            color: COLORS.textDark
          }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.inputLogin}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading && !googleLoading}
            autoFocus
          />
        </View>

        {/* Password Input */}
        <View>
          <Text style={{
            marginLeft: 50,
            padding: 8,
            fontWeight: "500",
            color: COLORS.textDark
          }}>
            Password
          </Text>
          <TextInput
            ref={passwordRef}
            style={styles.inputLogin}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={onLoginPress}
            editable={!loading && !googleLoading}
          />
        </View>

        {/* Forgot Password Link */}
        <Link href="/forgot-password" asChild>
          <TouchableOpacity disabled={loading || googleLoading}>
            <Text style={styles.linkText}>Forget password</Text>
          </TouchableOpacity>
        </Link>

        {/* Login Button */}
        <TouchableOpacity 
          style={[
            styles.buttonLogin,
            (loading || googleLoading) && { opacity: 0.6 }
          ]} 
          onPress={onLoginPress} 
          disabled={loading || googleLoading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={{ 
              color: COLORS.background, 
              fontWeight: 'bold', 
              fontSize: 16 
            }}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          marginTop: 10, 
          justifyContent: "center" 
        }}>
          <Text>Don't have an account?    
            <Link href="/sign-up" asChild>
              <TouchableOpacity disabled={loading || googleLoading}>
                <Text style={styles.linkText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </Text>
        </View>

        <Text style={{ textAlign: 'center', padding: 20 }}>or</Text>

        {/* Google Sign In Button */}
        <TouchableOpacity 
          style={[
            styles.google,
            (loading || googleLoading) && { opacity: 0.6 }
          ]} 
          onPress={handleGoogleAuth}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color={COLORS.primary} />
              <Text style={{ 
                fontSize: 16, 
                color: COLORS.primary,
                marginLeft: 8
              }}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}