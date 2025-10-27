import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../assets/styles/auth-styles.js';
import { COLORS } from '../color/colors.js';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }]}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        maxWidth: 350,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FFE5E5',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Ionicons name="alert-circle" size={50} color={COLORS.expense} />
        </View>
        
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold',
          color: COLORS.text,
          textAlign: 'center',
          marginBottom: 8
        }}>
          404 - Page Not Found
        </Text>
        
        <Text style={{ 
          fontSize: 16, 
          color: COLORS.textLight,
          textAlign: 'center',
          marginBottom: 30,
          lineHeight: 22
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        
        <TouchableOpacity 
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            minWidth: 150,
          }}
          onPress={() => router.replace('/')}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Go Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
