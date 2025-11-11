import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '@/color/colors';
import { api } from '../../src/api/client.js';

const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure', icon: 'trail-sign' },
  { id: 'relaxation', label: 'Relaxation', icon: 'bed' },
  { id: 'culture', label: 'Culture', icon: 'library' },
  { id: 'food', label: 'Foodie', icon: 'restaurant' },
  { id: 'nature', label: 'Nature', icon: 'leaf' },
  { id: 'urban', label: 'Urban', icon: 'business' },
  { id: 'beach', label: 'Beach', icon: 'water' },
  { id: 'mountain', label: 'Mountain', icon: 'navigate' },
];

const FOOD_PREFERENCES = {
  restaurant: [
    { id: 'fast_food', label: 'Fast Food', emoji: '🍟' },
    { id: 'noodles', label: 'Noodles', emoji: '🍜' },
    { id: 'grill', label: 'Grill', emoji: '🥩' },
    { id: 'pasta', label: 'Pasta', emoji: '🍝' },
    { id: 'dim_sum', label: 'Dim Sum', emoji: '🥟' },
    { id: 'indian_food', label: 'Indian Food', emoji: '🇮🇳' },
    { id: 'salads', label: 'Salads', emoji: '🥗' },
    { id: 'japanese_food', label: 'Japanese Food', emoji: '🍱' },
    { id: 'izakaya', label: 'Izakaya', emoji: '🍺' },
    { id: 'muu_kra_ta', label: 'Muu Kra Ta', emoji: '🐷' },
    { id: 'street_food', label: 'Street Food', emoji: '🥡' },
    { id: 'pork', label: 'Pork', emoji: '🐖' },
    { id: 'pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'vegan', label: 'Vegan', emoji: '🥬' },
    { id: 'chinese_food', label: 'Chinese Food', emoji: '🥢' },
    { id: 'sushi', label: 'Sushi', emoji: '🍣' },
    { id: 'fine_dining', label: 'Fine Dining', emoji: '🍽️' },
    { id: 'halal', label: 'Halal', emoji: '☪️' },
    { id: 'burger', label: 'Burger', emoji: '🍔' },
    { id: 'korean_food', label: 'Korean Food', emoji: '🇰🇷' },
    { id: 'buffet', label: 'Buffet', emoji: '🤤' },
    { id: 'ramen', label: 'Ramen', emoji: '🍜' },
    { id: 'bbq', label: 'BBQ', emoji: '🔥' },
    { id: 'meat', label: 'Meat', emoji: '🥓' },
    { id: 'healthy_food', label: 'Healthy Food', emoji: '🥑' },
    { id: 'shabu_sukiyaki', label: 'Shabu / Sukiyaki / Hot Pot', emoji: '🍲' },
    { id: 'omakase', label: 'Omakase', emoji: '🍤' },
    { id: 'seafood', label: 'Seafood', emoji: '🦀' },
  ],
  pub_bar: [
    { id: 'wine', label: 'Wine', emoji: '🍷' },
    { id: 'ratchathewi', label: 'Ratchathewi', emoji: '🥃' },
    { id: 'khaosan_road', label: 'Khaosan Road', emoji: '🏝️🍺' },
    { id: 'thonglor', label: 'Thonglor', emoji: '🥃' },
    { id: 'thai_music', label: 'Thai Music', emoji: '🎵' },
    { id: 'edm_music', label: 'EDM Music', emoji: '🎵' },
  ],
};

const BUDGET_RANGES = [
  { id: 'budget', label: 'Budget', min: 0, max: 1000 },
  { id: 'moderate', label: 'Moderate', min: 1000, max: 3000 },
  { id: 'luxury', label: 'Luxury', min: 3000, max: 10000 },
  { id: 'ultra_luxury', label: 'Ultra Luxury', min: 10000, max: null },
];

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Travel Preferences
  const [selectedTravelStyles, setSelectedTravelStyles] = useState([]);
  
  // Food Preferences
  const [selectedFoodPreferences, setSelectedFoodPreferences] = useState([]);
  
  // Budget
  const [selectedBudget, setSelectedBudget] = useState(null);
  
  // Availability
  const [availability, setAvailability] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    weekends_only: false,
    weekdays_only: false,
    flexible: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      
      // Load from local storage first (fallback while backend APIs are being developed)
      const savedTravel = await AsyncStorage.getItem('PREFERENCES_TRAVEL');
      const savedFood = await AsyncStorage.getItem('PREFERENCES_FOOD');
      const savedBudget = await AsyncStorage.getItem('PREFERENCES_BUDGET');
      
      if (savedTravel) {
        setSelectedTravelStyles(JSON.parse(savedTravel));
      }
      
      if (savedFood) {
        setSelectedFoodPreferences(JSON.parse(savedFood));
      }
      
      if (savedBudget) {
        setSelectedBudget(savedBudget);
      }
      
      // Try to fetch from API (when backend is ready)
      try {
        const [travelRes, foodRes, budgetRes] = await Promise.all([
          api.get('/api/v1/preferences/travel').catch(() => null),
          api.get('/api/v1/preferences/food').catch(() => null),
          api.get('/api/v1/preferences/budget').catch(() => null),
        ]);

        // Set travel styles from API if available
        if (travelRes?.data?.data) {
          const styles = travelRes.data.data.map(item => item.travel_style);
          setSelectedTravelStyles(styles);
          await AsyncStorage.setItem('PREFERENCES_TRAVEL', JSON.stringify(styles));
        }

        // Set food preferences from API if available
        if (foodRes?.data?.data) {
          const prefs = foodRes.data.data.map(item => item.food_type);
          setSelectedFoodPreferences(prefs);
          await AsyncStorage.setItem('PREFERENCES_FOOD', JSON.stringify(prefs));
        }

        // Set budget from API if available
        if (budgetRes?.data?.data?.budget_range) {
          setSelectedBudget(budgetRes.data.data.budget_range);
          await AsyncStorage.setItem('PREFERENCES_BUDGET', budgetRes.data.data.budget_range);
        }
      } catch (apiError) {
        console.log('API not available yet, using local storage');
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTravelStyle = (styleId) => {
    setSelectedTravelStyles(prev => {
      if (prev.includes(styleId)) {
        return prev.filter(id => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  const toggleFoodPreference = (prefId) => {
    setSelectedFoodPreferences(prev => {
      if (prev.includes(prefId)) {
        return prev.filter(id => id !== prefId);
      } else {
        return [...prev, prefId];
      }
    });
  };

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: !prev[day],
      // If toggling individual days, disable quick filters
      weekends_only: false,
      weekdays_only: false,
    }));
  };

  const toggleWeekends = () => {
    const newValue = !availability.weekends_only;
    setAvailability(prev => ({
      ...prev,
      weekends_only: newValue,
      weekdays_only: false,
      saturday: newValue,
      sunday: newValue,
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
    }));
  };

  const toggleWeekdays = () => {
    const newValue = !availability.weekdays_only;
    setAvailability(prev => ({
      ...prev,
      weekdays_only: newValue,
      weekends_only: false,
      monday: newValue,
      tuesday: newValue,
      wednesday: newValue,
      thursday: newValue,
      friday: newValue,
      saturday: false,
      sunday: false,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save to local storage first
      await AsyncStorage.setItem('PREFERENCES_TRAVEL', JSON.stringify(selectedTravelStyles));
      await AsyncStorage.setItem('PREFERENCES_FOOD', JSON.stringify(selectedFoodPreferences));
      if (selectedBudget) {
        await AsyncStorage.setItem('PREFERENCES_BUDGET', selectedBudget);
      }

      // Try to save to API (when backend is ready)
      try {
        await Promise.all([
          api.put('/api/v1/preferences/travel', {
            travel_styles: selectedTravelStyles,
          }).catch(() => null),
          api.put('/api/v1/preferences/food', {
            food_types: selectedFoodPreferences,
          }).catch(() => null),
          selectedBudget ? api.put('/api/v1/preferences/budget', {
            budget_range: selectedBudget,
          }).catch(() => null) : Promise.resolve(),
        ]);
      } catch (apiError) {
        console.log('API not available, saved locally');
      }

      // Always show success and go back
      Alert.alert('Success', 'Preferences saved successfully!', [
        { text: 'OK', onPress: () => router.replace('/profile') }
      ]);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.redwine} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.redwine} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Travel Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="airplane" size={20} color={COLORS.redwine} />
            <Text style={styles.sectionTitle}>Travel Styles</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select your preferred travel styles (you can choose multiple)
          </Text>
          <View style={styles.chipsContainer}>
            {TRAVEL_STYLES.map((style) => {
              const isSelected = selectedTravelStyles.includes(style.id);
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleTravelStyle(style.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={style.icon} 
                    size={18} 
                    color={isSelected ? '#fff' : COLORS.redwine} 
                  />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {style.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Food Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={20} color={COLORS.redwine} />
            <Text style={styles.sectionTitle}>Tell us what you like to do</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            We'll recommend events based on your interests! Select at least 5 items.
          </Text>

          {/* Restaurant Section */}
          <Text style={styles.categoryTitle}>Restaurant</Text>
          <View style={styles.foodChipsContainer}>
            {FOOD_PREFERENCES.restaurant.map((item) => {
              const isSelected = selectedFoodPreferences.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.foodChip, isSelected && styles.foodChipSelected]}
                  onPress={() => toggleFoodPreference(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.foodEmoji}>{item.emoji}</Text>
                  <Text style={[styles.foodChipText, isSelected && styles.foodChipTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pub & Bar Section */}
          <Text style={[styles.categoryTitle, { marginTop: 24 }]}>Pub & Bar</Text>
          <View style={styles.foodChipsContainer}>
            {FOOD_PREFERENCES.pub_bar.map((item) => {
              const isSelected = selectedFoodPreferences.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.foodChip, isSelected && styles.foodChipSelected]}
                  onPress={() => toggleFoodPreference(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.foodEmoji}>{item.emoji}</Text>
                  <Text style={[styles.foodChipText, isSelected && styles.foodChipTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selection Counter */}
          {selectedFoodPreferences.length < 5 && (
            <View style={styles.selectionCounter}>
              <Text style={styles.selectionCounterText}>
                Select {5 - selectedFoodPreferences.length} more items
              </Text>
            </View>
          )}
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet" size={20} color={COLORS.redwine} />
            <Text style={styles.sectionTitle}>Budget Range</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select your typical budget per trip (THB)
          </Text>
          <View style={styles.budgetContainer}>
            {BUDGET_RANGES.map((budget) => {
              const isSelected = selectedBudget === budget.id;
              return (
                <TouchableOpacity
                  key={budget.id}
                  style={[styles.budgetCard, isSelected && styles.budgetCardSelected]}
                  onPress={() => setSelectedBudget(budget.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.budgetRadio, isSelected && styles.budgetRadioSelected]}>
                    {isSelected && <View style={styles.budgetRadioDot} />}
                  </View>
                  <View style={styles.budgetContent}>
                    <Text style={[styles.budgetLabel, isSelected && styles.budgetLabelSelected]}>
                      {budget.label}
                    </Text>
                    <Text style={styles.budgetRange}>
                      ฿{budget.min.toLocaleString()}{budget.max ? ` - ฿${budget.max.toLocaleString()}` : '+'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.redwine,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.redwine,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  chipText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.redwine,
  },
  chipTextSelected: {
    color: '#fff',
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#000',
    marginBottom: 12,
    marginTop: 8,
  },
  foodChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.redwine,
    backgroundColor: '#fff',
  },
  foodChipSelected: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  foodEmoji: {
    fontSize: 16,
  },
  foodChipText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.redwine,
  },
  foodChipTextSelected: {
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  selectionCounter: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionCounterText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#1976d2',
  },
  listContainer: {
    gap: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  listItemText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  budgetContainer: {
    gap: 12,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  budgetCardSelected: {
    borderColor: COLORS.redwine,
    backgroundColor: '#fff5f5',
  },
  budgetRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetRadioSelected: {
    borderColor: COLORS.redwine,
  },
  budgetRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.redwine,
  },
  budgetContent: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#333',
    marginBottom: 2,
  },
  budgetLabelSelected: {
    color: COLORS.redwine,
  },
  budgetRange: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  quickFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  quickFilterActive: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  quickFilterText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#666',
  },
  quickFilterTextActive: {
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.redwine,
    borderColor: COLORS.redwine,
  },
  dayText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#666',
  },
  dayTextSelected: {
    color: '#fff',
  },
});
