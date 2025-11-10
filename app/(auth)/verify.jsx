import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/forget-styles.js";
import { COLORS } from "../../color/colors.js";
import { resendVerification, verifyEmail } from "../../src/api/auth.service.js";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { clearPassword, clearVerifyRegister, loadDisplayName, loadEmail, loadPassword, loadVerifyRegister, saveOTP, saveToken } from "../../src/lib/storage.js";
import { Notification } from "../../src/utils/Notification.jsx";
import { useAuth } from "../../src/contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from "../../src/api/client";


export default function Verification() {
  const [email, setEmail] = useState("");
  const router = useRouter("");
  const { login: ctxLogin } = useAuth();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isVerifyRegister, setIsVerifyRegister] = useState(false);
  const [otp, setOTP] = useState("");
  
  // OTP input states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // โหลด email, display_name, password และ verify_register จาก AsyncStorage เมื่อ component mount
  useEffect(() => {
    const loadStoredData = async () => {
      const storedEmail = await loadEmail();
      const storedDisplayName = await loadDisplayName();
      const storedPassword = await loadPassword();
      const storedVerifyRegister = await loadVerifyRegister();
      const storedOTP = await saveOTP();
      
      if (storedEmail) {
        setEmail(storedEmail);
        setEmailAddress(storedEmail);
      }
      
      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
      }
      
      if (storedPassword) {
        setPassword(storedPassword);
      }
      
      if (storedVerifyRegister !== null) {
        setIsVerifyRegister(storedVerifyRegister);
      }

      if (storedOTP) {
        setOTP(storedOTP);
      }
    };
    loadStoredData();
    setResendCooldown(180);
  }, []);

  // Timer สำหรับ resend cooldown
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle OTP input change
  const handleOtpChange = (text, index) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = text;
    setOtpDigits(newOtpDigits);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are filled
    const fullOtp = newOtpDigits.join('');
    if (fullOtp.length === 6 && !isVerifying) {
      setCode(fullOtp);
      // Auto verify
      setTimeout(() => {
        onVerifyPress(fullOtp);
      }, 100);
    }
  };

  // Handle backspace
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onVerifyPress = async (otpCode = null) => {
    const verificationCode = otpCode || otpDigits.join('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter 6-digit verification code");
      return;
    }

    if (isVerifying) return;

    try {
      setIsVerifying(true);
      setError("");
      setSuccess("");
      
      console.log("Verifying email with:", { email, code: verificationCode, password, displayName, isVerifyRegister });
      
      if (isVerifyRegister) {
        console.log("Using verify-ema_il API for registration verification");
        
        if (!password.trim()) {
          setError("Please enter password");
          setIsVerifying(false);
          return;
        }
        
        const response = await verifyEmail(email, verificationCode, password, displayName);
        console.log("Verify email response:", response);
        
        // Save token and user data manually to prevent auto-navigation from AuthContext
        await AsyncStorage.setItem('TOKEN', response.token);
        await AsyncStorage.setItem('USER_DATA', JSON.stringify(response.user));
        setAuthToken(response.token); // Set token in API client
        
        await clearVerifyRegister();
        await clearPassword();
        
        setSuccess("Email verified successfully! Redirecting...");
        setTimeout(() => {
          router.replace("/information");
        }, 1500);
        
      } else {

        await saveOTP(verificationCode);

        router.replace("/reset-password")

        console.log("Using different API for non-registration verification");
        setError("This verification type is not implemented yet");

      }
      
    } catch (err) {
      console.error("Verify email error:", err);
      setError(err.response?.data?.message || err.message || "Verification failed. Please try again.");
      // Clear OTP on error
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendPress = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setError("");
      setSuccess("");
      
      // Clear OTP inputs
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      console.log("Resending OTP to:", email);
      
      const response = await resendVerification(email);
      console.log("Resend verification response:", response);
      
      setResendCooldown(180);
      setSuccess("OTP has been resent successfully!");
      console.log("OTP resent successfully");
      
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(err.response?.data?.message || err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  return (
    <ProtectedRoute requireAuth={false}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        //extraScrollHeight={100}
      >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.push('/verify')} >
               <Ionicons name="chevron-back" size={32} color={COLORS.redwine}  />
             </TouchableOpacity>              
             <Text>Verify email address</Text>
            </View>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/Login-page/forget_verify.png")}
              style={styles.verificationLogo}
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.verificationTitle}>Verify email address</Text>
            <Text style={styles.verificationText}>
              Verification code sent to {email || "your email"}
            </Text>

            {/* OTP Input Boxes */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              marginVertical: 30,
            }}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => inputRefs.current[index] = ref}
                  style={{
                    width: 50,
                    height: 60,
                    borderWidth: 2,
                    borderColor: digit ? COLORS.redwine : '#E0E0E0',
                    borderRadius: 12,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: COLORS.textDark,
                    backgroundColor: '#fff',
                  }}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                />
              ))}
            </View>

            {isVerifying && (
              <Text style={{ 
                textAlign: 'center', 
                color: COLORS.redwine,
                marginBottom: 20,
                fontSize: 15,
              }}>
                Verifying...
              </Text>
            )}

            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={onResendPress}
                disabled={resendCooldown > 0 || isResending}
              >
                <Text style={[
                  styles.resendLink,
                  (resendCooldown > 0 || isResending) && styles.resendLinkDisabled
                ]}>
                  {isResending 
                    ? "Sending..." 
                    : resendCooldown > 0 
                      ? `Resend in ${formatTime(resendCooldown)}` 
                      : "Resend OTP"
                  }
                </Text>
              </TouchableOpacity>
            </View>

            <Notification
              type="error"
              message={error}
              onClose={() => setError("")}
            />

            <Notification
              type="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
    </ProtectedRoute>
  );
}
