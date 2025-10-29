import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

export default function CreateEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  

// title, address_text->google, start_at, end_at, capacity, event_type->meal, one_day_trip, overnight
// cat_id, tag_id optional
// join -> confirmed, leave
// tag completed events only creator events
// Home Create Profile my-events Chat

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address_text: '',
    start_at: '',
    end_at: '',
    capacity: '',
    budget_min: '',
    budget_max: '',
    currency: 'THB',
    event_type: 'group',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter an event title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return false;
    }
    if (!formData.address_text.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        address_text: formData.address_text,
        event_type: formData.event_type,
        currency: formData.currency,
      };

      // Add optional fields if provided
      if (formData.start_at) payload.start_at = new Date(formData.start_at).toISOString();
      if (formData.end_at) payload.end_at = new Date(formData.end_at).toISOString();
      if (formData.capacity) payload.capacity = parseInt(formData.capacity);
      if (formData.budget_min) payload.budget_min = parseFloat(formData.budget_min);
      if (formData.budget_max) payload.budget_max = parseFloat(formData.budget_max);

      const res = await api.post('/api/v1/events', payload);
      
      Alert.alert(
        'Success',
        'Event created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                address_text: '',
                start_at: '',
                end_at: '',
                capacity: '',
                budget_min: '',
                budget_max: '',
                currency: 'THB',
                event_type: 'group',
              });
              // Navigate to my events
              router.push('/my-events');
            },
          },
        ]
      );
    } catch (err) {
      console.error('Failed to create event', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Event</Text>
        <Text style={styles.headerSubtitle}>Organize your next trip</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Event Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekend in Chiang Mai"
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell others about your trip..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Location <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.inputText}
              placeholder="e.g., Chiang Mai, Thailand"
              value={formData.address_text}
              onChangeText={(text) => updateField('address_text', text)}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.start_at}
              onChangeText={(text) => updateField('start_at', text)}
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={{ width: 12 }} />
          
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.end_at}
              onChangeText={(text) => updateField('end_at', text)}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Size</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="people-outline" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.inputText}
              placeholder="Maximum number of people"
              value={formData.capacity}
              onChangeText={(text) => updateField('capacity', text)}
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Budget */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Budget Range (THB)</Text>
          <View style={styles.row}>
            <View style={[styles.inputWithIcon, { flex: 1 }]}>
              <TextInput
                style={styles.inputText}
                placeholder="Min"
                value={formData.budget_min}
                onChangeText={(text) => updateField('budget_min', text)}
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
            </View>
            
            <Text style={styles.separator}>—</Text>
            
            <View style={[styles.inputWithIcon, { flex: 1 }]}>
              <TextInput
                style={styles.inputText}
                placeholder="Max"
                value={formData.budget_max}
                onChangeText={(text) => updateField('budget_max', text)}
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: COLORS.redwine,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: 16,
    color: COLORS.textLight,
    marginHorizontal: 8,
  },
  createButton: {
    backgroundColor: COLORS.redwine,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
