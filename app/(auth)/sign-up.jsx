import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/auth-styles.js";
import { COLORS } from "../../color/colors.js";
import { register } from "../../src/api/auth.service.js";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { ERROR_MESSAGES } from "../../src/constants/errorMessages.js";
import { saveDisplayName, saveEmail, savePassword, saveVerifyRegister } from "../../src/lib/storage.js";
import { Notification } from "../../src/utils/Notification.jsx";
import { validateDisplayName, validateEmail, validatePassword, validateConfirmPassword } from "../../src/utils/validation.js";

const useSignUpForm = () => {
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user types
  };
  
  return {
    formData,
    loading,
    error,
    setError,
    setLoading,
    handleChange
  };
};

export default function SignUpScreen() {
  const router = useRouter("");

  const [display_name, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthColor, setStrengthColor] = useState("red");
  const [strengthLabel, setStrengthLabel] = useState("");

  // แยก error messages เป็น constants
  const ERROR_MESSAGES = {
    DISPLAY_NAME_REQUIRED: "Please enter display name",
    EMAIL_REQUIRED: "Please enter email",
    EMAIL_INVALID: "Please enter a valid email",
    PASSWORD_REQUIRED: "Please enter password",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
    PASSWORDS_NOT_MATCH: "Passwords do not match",
    EMAIL_EXISTS: "Email already exists",
    NETWORK_ERROR: "Network error. Please try again.",
    SERVER_ERROR: "Server error. Please try again later."
  };

  const onSignUpPress = async () => {
    console.log("Button pressed!");
    console.log("Current values:", { display_name, email, password, confirmPassword });
    
           const displayNameValidation = validateDisplayName(display_name);
           if (!displayNameValidation.isValid) {
             console.log("Error: Display name validation failed");
             setError(displayNameValidation.error);
             setSuccess("");
             return;
           }

           if (!email.trim()) {
             console.log("Error: Email is empty");
             setError(ERROR_MESSAGES.EMAIL_REQUIRED);
             setSuccess("");
             return;
           }

           if (!password.trim()) {
             console.log("Error: Password is empty");
             setError(ERROR_MESSAGES.PASSWORD_REQUIRED);
             setSuccess("");
             return;
           }

           if (!confirmPassword.trim()) {
             console.log("Error: Confirm password is empty");
             setError("Please confirm password");
             setSuccess("");
             return;
           }

           if (password !== confirmPassword) {
             console.log("Error: Passwords do not match");
             setError(ERROR_MESSAGES.PASSWORDS_NOT_MATCH);
             setSuccess("");
             return;
           }

           if (password.length < 8) {
             console.log("Error: Password too short");
             setError(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
             setSuccess("");
             return;
           }

           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
           if (!emailRegex.test(email)) {
             console.log("Error: Invalid email format");
             setError(ERROR_MESSAGES.EMAIL_INVALID);
             setSuccess("");
             return;
           }
    
    try {
      setLoading(true);
      setError("");
      
      const res = await register(email, password, display_name);
      console.log("Registration successful:", res);
      
      // เก็บข้อมูลที่จำเป็นสำหรับการ verify
      await Promise.all([
        saveEmail(email),
        saveDisplayName(display_name),
        savePassword(password),
        saveVerifyRegister(true)
      ]);
      
      router.replace({
        pathname: "/(auth)/verify",
        params: { email }
      });
    } catch (err) {
      if (err.response) {
        const errorCode = err.response.data?.code;
        switch(errorCode) {
          case 'CONFLICT':
            setError(ERROR_MESSAGES.EMAIL_EXISTS);
            break;
          default:
            setError(err.response.data?.message || ERROR_MESSAGES.SERVER_ERROR);
        }
      } else if (err.request) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } else {
        setError(ERROR_MESSAGES.SERVER_ERROR);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Update strength color and label
    if (strength === 0) {
      setStrengthColor("red");
      setStrengthLabel("");
    } else if (strength <= 2) {
      setStrengthColor("orange");
      setStrengthLabel("Weak");
    } else if (strength === 3) {
      setStrengthColor("lightgreen");
      setStrengthLabel("Moderate");
    } else {
      setStrengthColor("green");
      setStrengthLabel("Strong");
    }

    return (strength / 5) * 100;
  };

  // Handle password change
  const handlePasswordChange = (password) => {
    setPassword(password);
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
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

    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        justifyContent: "center",
        marginTop: 40,
      }}
    >
      <Image
        source={require("../../assets/images/Login-page/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.logoText}>TinderTrip</Text>
    </View>

    
    <View style={styles.popUpRegister}>
      
      <TouchableOpacity onPress={() => router.push('/login')} >
          <Ionicons name="chevron-back" size={32} color={COLORS.background}  />
      </TouchableOpacity>
      <Text style = {styles.subTopic}>Sign up</Text>
     
      <TextInput
        value={display_name}
        onChangeText={(text) => {
          setDisplayName(text);
          const validation = validateDisplayName(text);
          if (!validation.isValid) {
            setError(validation.error);
          } else {
            setError("");
          }
        }}
        style={[
          styles.inputLogin,
          error && error.includes("display name") && styles.inputError
        ]}
        placeholder="Display name (min. 2 characters)"
        placeholderTextColor="gray"
      />
      <Notification 
        type="error" 
        message={error && error.includes("display name") ? error : null} 
        onClose={() => setError("")} 
      />

      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          const validation = validateEmail(text);
          if (!validation.isValid) {
            setError(validation.error);
          } else {
            setError("");
          }
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[
          styles.inputLogin,
          error && (error.includes("email") || error.includes("Email")) && styles.inputError
        ]}
        placeholder="Email"
        placeholderTextColor="gray"
      />
      <Notification 
        type="error" 
        message={error && (error.includes("email") || error.includes("Email")) ? error : null} 
        onClose={() => setError("")} 
      />

      <View style={{ position: 'relative' }}>
        <TextInput
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!showPassword}
          style={[styles.inputLogin, { paddingRight: 44 }]}
          placeholder="Password"
          placeholderTextColor="gray"
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          style={{ position: 'absolute', right: 50, top: 0, bottom: 15, justifyContent: 'center' }}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color={COLORS.redwine}
          />
        </TouchableOpacity>
      </View>
      <Notification 
        type="error" 
        message={error && (error.includes("password") || error.includes("Password") || error.includes("characters")) && !error.includes("match") ? error : null} 
        onClose={() => setError("")} 
      />

      <View style={{ position: 'relative' }}>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          style={[styles.inputLogin, { paddingRight: 44 }]}
          placeholder="Confirm password"
          placeholderTextColor="gray"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword((v) => !v)}
          style={{ position: 'absolute', right: 50, top: 0, bottom: 15, justifyContent: 'center' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={22}
            color={COLORS.redwine}
          />
        </TouchableOpacity>
      </View>
      <Notification 
        type="error" 
        message={error && (error.includes("confirm") || error.includes("match")) ? error : null} 
        onClose={() => setError("")} 
      />

      {/* Password strength indicator */}
      <View style={styles.passwordStrengthContainer}>
        <View style={[
          styles.strengthBar,
          { width: `${passwordStrength}%`, backgroundColor: strengthColor }
        ]} />
        <Text style={styles.strengthText}>{strengthLabel}</Text>
      </View>

      {/* แสดง success notification */}
      <Notification 
        type="success" 
        message={success} 
        onClose={() => setSuccess("")} 
      />

      <TouchableOpacity 
        style={[
          styles.buttonSignUp,
          loading && styles.buttonDisabled
        ]} 
        onPress={onSignUpPress} 
        disabled={loading}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ 
            fontWeight: 'bold', 
            fontSize: 16, 
            color: COLORS.redwine, 
            marginRight: loading ? 10 : 0 
          }}>
            {loading ? "Signing up..." : "Sign Up"}
          </Text>
          {loading && <ActivityIndicator size="small" color={COLORS.redwine} />}
        </View>
      </TouchableOpacity>
    </View>
  
  </KeyboardAwareScrollView>
  </ProtectedRoute>
)
};