import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../src/api/client.js';
import { COLORS } from '@/color/colors';

export default function CreateEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Capacity picker state
  const [showCapacityPicker, setShowCapacityPicker] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address_text: '',
    capacity: '3', // Default to 3
    budget_min: '',
    budget_max: '',
    currency: 'THB',
    event_type: 'one_day_trip', // Must be: meal, one_day_trip, or overnight
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDisplayDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${weekday} ${month} ${day} ${hours}:${minutesStr} ${ampm}`;
  };

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setStartDate(selectedDate);
        // Show time picker after date is selected
        setTimeout(() => setShowStartTimePicker(true), 100);
      }
    } else {
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime && startDate) {
      const newDate = new Date(startDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setStartDate(newDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setEndDate(selectedDate);
        // Show time picker after date is selected
        setTimeout(() => setShowEndTimePicker(true), 100);
      }
    } else {
      if (selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime && endDate) {
      const newDate = new Date(endDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEndDate(newDate);
    }
  };

  const handleStartDatePress = () => {
    setShowEndDatePicker(false); // Close end date picker if open
    setShowEndTimePicker(false);
    setShowStartTimePicker(false);
    setShowCapacityPicker(false); // Close capacity picker if open
    setShowStartDatePicker(true);
  };

  const handleEndDatePress = () => {
    setShowStartDatePicker(false); // Close start date picker if open
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setShowCapacityPicker(false); // Close capacity picker if open
    setShowEndDatePicker(true);
  };

  const handleCapacityPress = () => {
    setShowStartDatePicker(false); // Close date pickers if open
    setShowEndDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setShowCapacityPicker(true);
  };

  const closeDatePickers = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const closeTimePickers = () => {
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const closeCapacityPicker = () => {
    setShowCapacityPicker(false);
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
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
    if (startDate && endDate && endDate < startDate) {
      Alert.alert('Validation Error', 'End date must be after start date');
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
      if (startDate) payload.start_at = startDate.toISOString();
      if (endDate) payload.end_at = endDate.toISOString();
      if (formData.capacity) payload.capacity = parseInt(formData.capacity);
      if (formData.budget_min) payload.budget_min = parseFloat(formData.budget_min);
      if (formData.budget_max) payload.budget_max = parseFloat(formData.budget_max);

      if (selectedImage) {
        console.log('Selected image:', selectedImage.uri);
      }

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
                capacity: '',
                budget_min: '',
                budget_max: '',
                currency: 'THB',
                event_type: 'one_day_trip',
              });
              setSelectedImage(null);
              setStartDate(null);
              setEndDate(null);
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
        {/* Cover Image */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cover Photo</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={showImageOptions}
              >
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imagePlaceholder}
              onPress={showImageOptions}
            >
              <Ionicons name="camera" size={48} color={COLORS.textLight} />
              <Text style={styles.imagePlaceholderText}>Add Cover Photo</Text>
              <Text style={styles.imagePlaceholderSubtext}>Tap to select or take a photo</Text>
            </TouchableOpacity>
          )}
        </View>

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

        {/* Event Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Event Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.eventTypeContainer}>
            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                formData.event_type === 'meal' && styles.eventTypeButtonActive,
              ]}
              onPress={() => updateField('event_type', 'meal')}
            >
              <Ionicons 
                name="restaurant-outline" 
                size={20} 
                color={formData.event_type === 'meal' ? '#fff' : COLORS.textLight} 
              />
              <Text style={[
                styles.eventTypeText,
                formData.event_type === 'meal' && styles.eventTypeTextActive,
              ]}>
                Meal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                formData.event_type === 'one_day_trip' && styles.eventTypeButtonActive,
              ]}
              onPress={() => updateField('event_type', 'one_day_trip')}
            >
              <Ionicons 
                name="sunny-outline" 
                size={20} 
                color={formData.event_type === 'one_day_trip' ? '#fff' : COLORS.textLight} 
              />
              <Text style={[
                styles.eventTypeText,
                formData.event_type === 'one_day_trip' && styles.eventTypeTextActive,
              ]}>
                Day Trip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.eventTypeButton,
                formData.event_type === 'overnight' && styles.eventTypeButtonActive,
              ]}
              onPress={() => updateField('event_type', 'overnight')}
            >
              <Ionicons 
                name="bed-outline" 
                size={20} 
                color={formData.event_type === 'overnight' ? '#fff' : COLORS.textLight} 
              />
              <Text style={[
                styles.eventTypeText,
                formData.event_type === 'overnight' && styles.eventTypeTextActive,
              ]}>
                Overnight
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={handleStartDatePress}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} />
              <View style={styles.dateTextContainer}>
                {startDate ? (
                  <>
                    <Text style={styles.dateButtonText}>
                      {new Date(startDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.timeButtonText}>
                      {new Date(startDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Select date & time</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={{ width: 12 }} />
          
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>End Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={handleEndDatePress}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.textLight} />
              <View style={styles.dateTextContainer}>
                {endDate ? (
                  <>
                    <Text style={styles.dateButtonText}>
                      {new Date(endDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={styles.timeButtonText}>
                      {new Date(endDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Select date & time</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* iOS Date & Time Picker with Done Button */}
        {Platform.OS === 'ios' && (showStartDatePicker || showEndDatePicker || showStartTimePicker || showEndTimePicker) && (
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosDatePickerHeader}>
              <Text style={styles.iosDatePickerTitle}>
                {showStartDatePicker && 'Select Start Date & Time'}
                {showEndDatePicker && 'Select End Date & Time'}
                {showStartTimePicker && 'Select Start Time'}
                {showEndTimePicker && 'Select End Time'}
              </Text>
              <TouchableOpacity onPress={() => {
                closeDatePickers();
                closeTimePickers();
              }}>
                <Text style={styles.iosDatePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="datetime"
                display="spinner"
                onChange={onStartDateChange}
                minimumDate={new Date()}
              />
            )}
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || startDate || new Date()}
                mode="datetime"
                display="spinner"
                onChange={onEndDateChange}
                minimumDate={startDate || new Date()}
              />
            )}
            {showStartTimePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="time"
                display="spinner"
                onChange={onStartTimeChange}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="time"
                display="spinner"
                onChange={onEndTimeChange}
              />
            )}
          </View>
        )}

        {/* Android Date & Time Pickers */}
        {Platform.OS === 'android' && showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {Platform.OS === 'android' && showStartTimePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="time"
            display="default"
            onChange={onStartTimeChange}
          />
        )}
        
        {Platform.OS === 'android' && showEndDatePicker && (
          <DateTimePicker
            value={endDate || startDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate || new Date()}
          />
        )}
        
        {Platform.OS === 'android' && showEndTimePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="time"
            display="default"
            onChange={onEndTimeChange}
          />
        )}

        {/* Capacity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Size</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={handleCapacityPress}
          >
            <Ionicons name="people-outline" size={20} color={COLORS.textLight} style={{ marginRight: 8 }} />
            <Text style={[styles.inputText, { flex: 1 }]}>
              {formData.capacity ? `${formData.capacity} people` : 'Select group size'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Capacity Picker for iOS */}
        {Platform.OS === 'ios' && showCapacityPicker && (
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosPickerHeader}>
              <Text style={styles.iosPickerTitle}>Select Group Size</Text>
              <TouchableOpacity onPress={closeCapacityPicker}>
                <Text style={styles.iosDoneButton}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={formData.capacity}
              onValueChange={(value) => updateField('capacity', value)}
              style={styles.iosPicker}
            >
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                <Picker.Item key={num} label={`${num} people`} value={num.toString()} />
              ))}
            </Picker>
          </View>
        )}

        {/* Capacity Picker for Android */}
        {Platform.OS === 'android' && showCapacityPicker && (
          <Picker
            selectedValue={formData.capacity}
            onValueChange={(value) => {
              updateField('capacity', value);
              setShowCapacityPicker(false);
            }}
            style={styles.androidPicker}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
              <Picker.Item key={num} label={`${num} people`} value={num.toString()} />
            ))}
          </Picker>
        )}

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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  timeButtonText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  placeholderText: {
    color: '#999',
    fontSize: 15,
  },
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  iosDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.redwine,
  },
  iosPicker: {
    width: '100%',
  },
  androidPicker: {
    marginBottom: 20,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  iosDatePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  iosDatePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.redwine,
  },
  imagePlaceholder: {
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  eventTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  eventTypeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 6,
  },
  eventTypeButtonActive: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  eventTypeTextActive: {
    color: '#fff',
  },
});
