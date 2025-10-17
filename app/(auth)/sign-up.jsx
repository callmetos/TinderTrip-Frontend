import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/auth-styles.js";
import { COLORS } from "../../color/colors.js";
import { register } from "../../src/api/auth.service.js";
import { saveDisplayName, saveEmail, savePassword, saveVerifyRegister } from "../../src/lib/storage.js";
import { Notification } from "../../src/utils/Notification.jsx";

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

  
  const onSignUpPress = async () => {
    console.log("Button pressed!");
    console.log("Current values:", { display_name, email, password, confirmPassword });
    
           if (!display_name.trim()) {
             console.log("Error: Display name is empty");
             setError("Please enter display name");
             setSuccess("");
             return;
           }

           if (!email.trim()) {
             console.log("Error: Email is empty");
             setError("Please enter email");
             setSuccess("");
             return;
           }

           if (!password.trim()) {
             console.log("Error: Password is empty");
             setError("Please enter password");
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
             setError("Passwords do not match");
             setSuccess("");
             return;
           }

           if (password.length < 8) {
             console.log("Error: Password too short");
             setError("Password must be at least 8 characters");
             setSuccess("");
             return;
           }

           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
           if (!emailRegex.test(email)) {
             console.log("Error: Invalid email format");
             setError("Please enter a valid email");
             setSuccess("");
             return;
           }
    
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      console.log("Calling register API...");
      
             const res = await register(email, password, display_name);
             console.log("API Response:", res);

             // เก็บ email, display_name, password และ verify_register ลง AsyncStorage
             await saveEmail(email);
             await saveDisplayName(display_name);
             await savePassword(password);
             await saveVerifyRegister(true);
             

             router.replace("/verify");
    } catch (err) {
      console.error("Signup error:", err);
      console.log("Error details:", err.response);
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };



return (
  
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
        onChangeText={setDisplayName}
        style={styles.inputLogin}
        placeholder="Display name"
        placeholderTextColor="gray"
      />
      <Notification 
        type="error" 
        message={error && error.includes("display name") ? error : null} 
        onClose={() => setError("")} 
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.inputLogin}
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
          onChangeText={setPassword}
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

      {/* ไม่แสดง success notification */}
      {/* <Notification 
        type="success" 
        message={success} 
        onClose={() => setSuccess("")} 
      /> */}

      <TouchableOpacity style = {styles.buttonSignUp} onPress={onSignUpPress} disabled={loading}>
        <Text style = {{ fontWeight: 'bold',fontSize:16, color: COLORS.redwine }}>SignUp</Text>
      </TouchableOpacity>
    </View>
  
  </KeyboardAwareScrollView>
)
};