import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../assets/styles/auth-styles.js';
import { COLORS } from '../../color/colors.js';

export const ErrorNotification = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={20} color={COLORS.expense}/>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={20} color={COLORS.textLight}/>
      </TouchableOpacity>
    </View>
  );
};

export const SuccessNotification = ({ success, onClose }) => {
  if (!success) return null;
  
  return (
    <View style={styles.successBox}>
      <Ionicons name="checkmark-circle" size={20} color="#4CAF50"/>
      <Text style={styles.successText}>{success}</Text>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={20} color="#2E7D32"/>
      </TouchableOpacity>
    </View>
  );
};

export const Notification = ({ type, message, onClose }) => {
  if (!message) return null;
  
  if (type === 'error') {
    return <ErrorNotification error={message} onClose={onClose} />;
  }
  
  if (type === 'success') {
    return <SuccessNotification success={message} onClose={onClose} />;
  }
  
  return null;
};
