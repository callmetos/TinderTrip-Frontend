import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../../assets/styles/auth-styles.js';

export default function InformationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Information</Text>
      <Text style={styles.subtitle}>This is the information page</Text>
    </View>
  );
}
