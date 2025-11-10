import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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


export default function Verification() {
  const [email, setEmail] = useState("");
  const router = useRouter("");

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
  const [otp, setOTP] = useState("")

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

  const onVerifyPress = async () => {
    if (!code.trim()) {
      setError("Please enter verification code");
      return;
    }

    try {
      setError("");
      setSuccess("");
      
      console.log("Verifying email with:", { email, code, password, displayName, isVerifyRegister });
      
      if (isVerifyRegister) {
        console.log("Using verify-ema_il API for registration verification");
        
        if (!password.trim()) {
          setError("Please enter password");
          return;
        }
        
        const response = await verifyEmail(email, code, password, displayName);
        console.log("Verify email response:", response);
        
        await saveToken(response.token);
        await clearVerifyRegister();
        await clearPassword();
        
        setSuccess("Email verified successfully!");
        setTimeout(() => {
          router.replace("/welcome");
        }, 2000);
        
      } else {

        await saveOTP(code);

        router.replace("/reset-password")

        console.log("Using different API for non-registration verification");
        setError("This verification type is not implemented yet");

      }
      
    } catch (err) {
      console.error("Verify email error:", err);
      setError(err.response?.data?.message || err.message || "Verification failed. Please try again.");
    }
  };

  const onResendPress = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setError("");
      setSuccess("");
      
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

            <TextInput
              style={styles.verificationInput}
              placeholder="Verification Code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.resetButton} onPress={onVerifyPress}>
              <Text style={styles.resetButtonText}>Verify</Text>
            </TouchableOpacity>

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
