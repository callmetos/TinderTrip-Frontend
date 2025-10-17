import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Dimensions, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';
import { getGoogleAuthUrl, login } from '../../src/api/auth.service';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SHEET_RATIO = 0.75;
  const { height } = Dimensions.get("window");
  const SHEET_HEIGHT = height * SHEET_RATIO;

  const onLoginPress = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const response = await login(email, password);
      console.log('Login successful:', response);
      
      if (!response?.token) {
        throw new Error('Login failed: token missing');
      }
      
      if (response?.user) {
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(response.user));
      }
      router.replace('/welcome');
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (error.errors?.[0]?.code === "form_password_incorrect") {
        setError("Password is incorrect. Please try again.");
      } else {
        setError("An error occurred, Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      console.log('Google login button pressed!');
      const response = await getGoogleAuthUrl();
      console.log('Google auth response:', response);
      
      // ใช้ callback URL ที่แตกต่างกันตาม platform
      const redirectUrl = Platform.OS === 'web' 
        ? 'http://localhost:8081/callback' 
        : 'mobileapp://callback';
      
      console.log('Using expo-web-browser for native OAuth');
      
      console.log('Platform:', Platform.OS);
      console.log('Redirect URL:', redirectUrl);
      console.log('Auth URL:', response.auth_url);
      
      console.log('Opening WebBrowser...');
      
      // เปิดเว็บขึ้นมาบนแอพ → หน้า google-redirect → รอ 5 วินาที → ไป Google OAuth
      console.log(`Platform is ${Platform.OS}, opening WebBrowser to google-redirect...`);
      console.log('Auth URL:', response.auth_url);
      
      // สร้าง URL สำหรับหน้า google-redirect
      const googleRedirectUrl = `http://localhost:8081/google-redirect?auth_url=${encodeURIComponent(response.auth_url)}`;
      console.log('Google Redirect URL:', googleRedirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        googleRedirectUrl,
        redirectUrl
      );
      
      console.log('WebBrowser result:', result);
      console.log('Result type:', result.type);
      console.log('Result URL:', result.url);
      
      if (result.type === 'success') {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const user_id = url.searchParams.get('user_id');
        const email = url.searchParams.get('email');
        const display_name = url.searchParams.get('display_name');
        const provider = url.searchParams.get('provider');
        
        if (token) {
          await AsyncStorage.setItem('TOKEN', token);
          
          const userData = {
            id: user_id,
            email: email,
            display_name: display_name,
            provider: provider
          };
          
          await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));
          
          console.log('Google OAuth login successful:', userData);
          
          router.replace('/');
        } else {
          Alert.alert('Error', 'No token received from Google OAuth');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled Google authentication');
      } else {
        Alert.alert('Error', 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Failed to get Google auth URL');
    }
  };

  return (
    <KeyboardAwareScrollView
      style = {{ flex: 1}}
      contentContainerStyle = {{flexGrow: 1}}
      enableOnAndroid= {true}
      enableAutomaticScroll= {true}
    >

    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, justifyContent: "center" }}>
        <Image source={require("../../assets/images/Login-page/logo.png")} style = {styles.logo} />
        <Text style={ styles.logoText }>
          TinderTrip
        </Text>
      </View>
    
      <View>
      <Text style = {{
        marginLeft:50,
        padding:8, 
        fontWeight: "500",
        placeholderTextColor: "#6A2E35"
      }}>Email</Text>

      {error ? (
            <View style = {styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color = {COLORS.expense}/>
              <Text style = {styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <Ionicons name="close" size={20} color = {COLORS.textLight}/>
              </TouchableOpacity>
            </View>
          ) : null}
      
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.inputLogin}
      />
      </View>
      
      <Text style = {{
        marginLeft:50,
        padding:8, 
        fontWeight: "500",
        placeholderTextColor: "#6A2E35"}}>Password</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[styles.inputLogin, { paddingRight: 44 }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          style={{ position: 'absolute', right: 50, top: 0, bottom: 15, justifyContent: 'center' }}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={COLORS.redwine} />
        </TouchableOpacity>
      </View>

      <Link href="/forgot-password" asChild>
            <TouchableOpacity>
              <Text style = {styles.linkText}>Forget password</Text>
            </TouchableOpacity>
      </Link>
      

      <TouchableOpacity style = {styles.buttonLogin} onPress={() => onLoginPress()} disabled={loading}>
            <Text style = {{color:COLORS.background, fontWeight: 'bold',fontSize:16 }}>Login</Text>
      </TouchableOpacity>
      
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: -10, justifyContent: "center" }}>
      <Text>Don't have an account?    
        <Link href="/sign-up" asChild>
          <Text style = {styles.linkText} >Sign Up</Text>
        </Link>
      </Text>
      </View>
      <Text style = {{textAlign: 'center', padding:20 }}>or</Text>

      <TouchableOpacity style = {styles.google} onPress={handleGoogleAuth}>
          <Ionicons name="logo-google" size={24} color={COLORS.primary} />
          <Text Size={16} color={COLORS.primary}>Continue with Google</Text>
      </TouchableOpacity>

    </View>
    </KeyboardAwareScrollView>
  );
}