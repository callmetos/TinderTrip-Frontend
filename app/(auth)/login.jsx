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
import { useAuth } from '../../src/contexts/AuthContext';

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
  const { login: ctxLogin } = useAuth(); // ใช้ login จาก AuthContext
  
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
      
      if (__DEV__) console.log('[Login] Attempting login with:', email);
      const response = await login(email, password);
      
      if (__DEV__) {
        console.log('[Login] API response:', {
          hasToken: !!response.token,
          hasUser: !!response.user,
          responseKeys: Object.keys(response)
        });
      }
      
      if (!response.token) {
        throw new Error('No token in response');
      }
      
      if (!response.user) {
        throw new Error('No user data in response');
      }
      
      // ใช้ AuthContext login แทนการบันทึกเอง
      if (__DEV__) console.log('[Login] Calling AuthContext login...');
      await ctxLogin(response.user, response.token);
      
      if (__DEV__) console.log('[Login] Login successful');
      // AuthContext จะ navigate ไปหน้า welcome เอง
      
    } catch (err) {
      if (__DEV__) {
        console.error('[Login] Login error:', err);
        console.error('[Login] Error response:', err?.response?.data);
      }
      
      // User-friendly error messages
      let errorMessage;
      
      if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.status === 401) {
        // prefer backend message if provided
        errorMessage = err.response?.data?.message || 'Invalid email or password. Please try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Account not found. Please sign up first.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.response?.data?.message 
          || err.response?.data?.error 
          || err.message 
          || 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      if (__DEV__) console.log('[Login] Initiating Google OAuth...');
      
      const response = await getGoogleAuthUrl();
      const redirectUrl = getRedirectUrl();
      const isWeb = Platform.OS === 'web';
      // For web, we bounce through our /google-redirect page to keep same origin.
      // For native, open the provider URL directly.
      const googleRedirectUrl = isWeb
        ? `${window.location.origin}/google-redirect?auth_url=${encodeURIComponent(response.auth_url)}`
        : response.auth_url;

      if (__DEV__) console.log('[Login] Opening Google OAuth session...');

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
          // ใช้ AuthContext login แทนการบันทึกเอง
          const userData = {
            id: user_id,
            email: userEmail,
            display_name: display_name,
            provider: provider
          };
          
          await ctxLogin(userData, token);
          if (__DEV__) console.log('[Login] Google OAuth successful');
          
          // AuthContext จะ navigate ไปหน้า welcome เอง
        } else {
          setError('Authentication failed. No token received.');
        }
      } else if (result.type === 'cancel') {
        if (__DEV__) console.log('[Login] User cancelled Google authentication');
      } else {
        setError('Google authentication failed. Please try again.');
      }
      
    } catch (err) {
      if (__DEV__) console.error('[Login] Google auth error:', err);
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