import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/color/colors'
import { styles } from '../../assets/styles/auth-styles.js'
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = () => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: COLORS.background}}>
      <View style = {styles.container}>
        <View style = {styles.profileIconCircle}>
          <Ionicons name="person" size={100} color = {COLORS.redwine}/>
        </View>
        <Text style = {styles.title} >Create Your Profile</Text>
        <Text style = {styles.subtitle}>To know more about you? Find more compatible people, places and group</Text>
      </View>
      <TouchableOpacity onPress={() => setError("")}>
        <View style={styles.buttonProfile}>
          <Text style={styles.buttonText}>Get Started</Text>
        </View>
      </TouchableOpacity>

    </SafeAreaView>
  )
}

export default WelcomeScreen