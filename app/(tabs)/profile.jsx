import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../assets/styles/info-styles.js';
import { COLORS } from '../../color/colors.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InformationScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('USER_DATA');
      const token = await AsyncStorage.getItem('TOKEN');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

        {/* Header */}
        <View style ={{
          backgroundColor: COLORS.redwine,
          height: 100,
          borderRadius: 45,
          


        }}>
          <View style = {styles.headerLeft}>
            
            <View style = {styles.welcomeContainer}>
              <Text style = {styles.welcomeText}>Welcome,</Text>
              <Text style = {styles.usernameText}>
                {user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>
        </View>
  

      <Text style={styles.title}>Information</Text>
      <Text style={styles.subtitle}>This is the information page</Text>
    </View>
  );
}
