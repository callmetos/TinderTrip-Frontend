import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { styles } from '../../assets/styles/forget-styles.js'
import { COLORS } from '../../color/colors.js'
import { resetPassword } from '../../src/api/auth.service.js'
import { loadEmail, loadOTP } from "../../src/lib/storage.js"
import { Notification } from '../../src/utils/Notification.jsx'

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [storedEmail, setStoredEmail] = useState('');
  const [storedOTP, setStoredOTP] = useState('');
  const router = useRouter('');

  const clearError = () => setError("");
  const clearSuccess = () => setSuccess("");

   useEffect(() => {
      const loadStoredData = async () => {
        const email = await loadEmail();
        const otp = await loadOTP();
        setStoredEmail(email);
        setStoredOTP(otp);
      };
      loadStoredData();
    }, []);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      setError("Please enter password");
      setSuccess("");
      return;
    }
    if (!confirmPassword.trim()) {
      setError("Please confirm password");
      setSuccess("");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSuccess("");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const res = await resetPassword(storedEmail, storedOTP, password);
      console.log("Reset password response:", res);
      
      setSuccess("Password has been reset successfully");
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      
    } catch (err) {
      console.error("Reset password error:", err);
      console.log("Error response:", err.response?.data);
      
      // Handle different error formats
      let errorMessage = "Something went wrong";
      
      if (err.response?.data) {
        // Check for error message in response
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSuccess("");
    } finally {
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
             <TouchableOpacity onPress={() => router.push('/verify')} >
               <Ionicons name="chevron-back" size={32} color={COLORS.redwine}  />
             </TouchableOpacity>
            <Text>New password</Text>
          </View>
        </View>
        
        <View style={styles.formContainer}>
          <Text style = {styles.passwordTitle}>New password</Text>
          <Text style = {styles.passwordText}>
            Please write your new password
          </Text>
          
          <Notification type="error" message={error} onClose={clearError} />
          <Notification type="success" message={success} onClose={clearSuccess} />
          
          <TextInput
            style={styles.verificationInput}
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            placeholderTextColor="gray"
          />

          <TextInput
            style={styles.verificationInput}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            placeholderTextColor="gray"
          />
          
          <TouchableOpacity 
            style={[styles.resetButton, loading && { opacity: 0.6 }]} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? 'Resetting...' : 'Confirm Passwords'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
      
    </View>

    </KeyboardAwareScrollView>
  )
}