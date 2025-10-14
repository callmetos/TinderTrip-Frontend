import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { styles } from '../../assets/styles/forget-styles.js'
import { COLORS } from '../../color/colors.js'
import { forgetPassword } from '../../src/api/auth.service'
import { saveEmail } from "../../src/lib/storage.js"



export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter('');
  const [success, setSuccess] = useState("");


  const handleForgotPassword = async () => {

    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!email.trim()) {
      console.log("Error: Email is empty");
      setError("Please enter email");
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
      console.log("Calling forgot password API...");
          
      const res = await forgetPassword(email);
      console.log("API Response:", res);

      await saveEmail(email);

      // เก็บ email, display_name, password และ verify_register ลง AsyncStorage
      router.replace("/verify");
    } catch (err) {
      console.error("Email error:", err);
      console.log("Error details:", err.response);
      setError(err.response?.data?.error || err.message || "Something went wrong");
    }finally {
      setLoading(false);
    }
    
  };
  

  return (
    <KeyboardAwareScrollView
      style = {{ flex: 1}}
      contentContainerStyle = {{flexGrow: 1}}
      enableOnAndroid= {true}
      enableAutomaticScroll= {true}
      //extraScrollHeight={100}
    >
    <View style = {styles.container}>
      <View style = {styles.content}>
        <View style = {styles.header}>
          <View style = {styles.headerLeft}>
             <TouchableOpacity onPress={() => router.push('/login')} >
               <Ionicons name="chevron-back" size={32} color={COLORS.redwine}  />
             </TouchableOpacity>
            <Text>Forget Password</Text>
          </View>
        </View>
        
        <View style={styles.imageContainer}>
          <Image source={require("../../assets/images/Login-page/forget_verify.png")}
          style={styles.verificationLogo}/>
        </View>
        
        <View style={styles.formContainer}>
          <Text style = {styles.verificationTitle}>Forget password?</Text>
          <Text style = {styles.verificationText}>
            Don't worry! Enter your email address and we'll send you a verification code to reset your password.
          </Text>
          
          <TextInput
            style={styles.verificationInput}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity style={styles.resetButton} onPress={handleForgotPassword}>
            <Text style={styles.resetButtonText}>Confirmation Mail</Text>
          </TouchableOpacity>
          
        </View>

      </View>
      
    </View>
    </KeyboardAwareScrollView>
  )
};