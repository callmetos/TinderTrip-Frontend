import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../../assets/styles/info-styles.js';
import { COLORS } from '../../color/colors.js';
import { setAuthToken } from '../../src/api/client.js';
import { getUserProfile, updateUserProfile } from '../../src/api/info.service.js';
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx';
import { loadToken } from '../../src/lib/storage.js';
import { fetchAuthenticatedImage } from '../../src/utils/imageLoader.js';


const normalize = (value) =>
  String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");


const GENDER_OPTIONS = [
  { label: "Male",            value: "male" },
  { label: "Female",          value: "female" },
  { label: "Not specified",   value: "nonbinary" },
  { label: "Prefer Not Say",  value: "prefer_not_say" },
];

const SMOKING_OPTIONS = [
  { label: "Non-smoking", value: "no" },
  { label: "Smoking",     value: "yes" },
  { label: "Sometime",    value: "occasionally" },
];


const toBackendGender = (v) => {
  const k = normalize(v);
  const map = {
    male: "male",
    female: "female",
    nonbinary: "nonbinary",
    "not_specified": "nonbinary",
    "not specified": "nonbinary",
    "prefer_not_say": "prefer_not_say",
    "prefer-not-say": "prefer_not_say",
    "prefer not say": "prefer_not_say",
  };
  return map[k] ?? "";
};

const toBackendSmoking = (v) => {
  const k = normalize(v);
  const map = {
    no: "no",
    "non_smoking": "no",
    "non-smoking": "no",
    yes: "yes",
    smoking: "yes",
    occasionally: "occasionally",
    sometime: "occasionally",
  };
  return map[k] ?? "";
};


const genderLabel = (code) =>
  GENDER_OPTIONS.find(o => o.value === code)?.label ?? "Select gender";

const smokingLabel = (code) =>
  SMOKING_OPTIONS.find(o => o.value === code)?.label ?? "Smoking or not";

const WebDateInput = ({ value, onChange }) => {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="date"
        value={value instanceof Date ? value.toISOString().slice(0,10) : (value || "")}
        onChange={(e) => {
          const v = e.target.value; // "YYYY-MM-DD"
          onChange(v ? new Date(`${v}T00:00:00Z`) : null);
        }}
        style={{
          width: "100%",
          height: 44,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 16,
          color: value ? "#222" : "#999",
          padding: "0 36px 0 14px", // Space for the icon
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      />
      {/* Calendar icon overlayed on the right */}
      <div style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }}>
        <Ionicons name="calendar-outline" size={20} color="#999" />
      </div>
    </div>
  );
};


export default function InformationScreen() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const navigation = useNavigation();
  const { mode, from } = useLocalSearchParams();
  const isEdit = String(mode || "").toLowerCase() === "edit";
  const scrollRef = useRef(null);

  // Hide tab bar when in setup mode (not edit mode)
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isEdit ? undefined : { display: 'none' },
    });
  }, [navigation, isEdit]);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(""); 
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showjobTitlePicker, setShowJobTitlePicker] = useState(false);
  const [showSmokingPicker, setShowSmokingPicker] = useState(false);

  const [date, setDate] = useState(null);
  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);
  const [iosTempDate, setIosTempDate] = useState(new Date());

  const [gender, setGender] = useState("");   
  const [age, setAge] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [smoking, setSmoking] = useState(""); 
  const [interests, setInterests] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Calculate age from date of birth
  useEffect(() => {
    if (!date) { 
      setAge(null); 
      return; 
    }
    const today = new Date();
    const dob = new Date(date);
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    
    // Validate minimum age (e.g., 13 years old)
    if (a < 13) {
      setAge(null);
    } else {
      setAge(a);
    }
  }, [date]);


  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("USER_DATA");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Loaded user:", parsedUser);

          const resolvedName = parsedUser.display_name ?? parsedUser.name ?? "";
          setName(resolvedName);

          setBio(parsedUser.bio ?? "");

          const languagesValue = parsedUser.languages;
          if (Array.isArray(languagesValue)) {
            setSelectedLanguage(languagesValue.filter(Boolean).join(", "));
          } else {
            setSelectedLanguage(languagesValue ?? "");
          }

          const rawDob = parsedUser.date_of_birth ?? null;
          if (rawDob) {
            const parsedDate = new Date(rawDob);
            if (!Number.isNaN(parsedDate.getTime())) {
              setDate(parsedDate);
            }
          }

          setAge(
            parsedUser.age !== undefined && parsedUser.age !== null
              ? (isNaN(parseInt(parsedUser.age, 10)) ? "" : parseInt(parsedUser.age, 10))
              : ""
          );

          setGender(toBackendGender(parsedUser.gender));
          setJobTitle(parsedUser.job_title ?? "");
          setSmoking(toBackendSmoking(parsedUser.smoking));
          setInterests(parsedUser.interests_note ?? "");
          
          // Load avatar with authentication if URL exists
          if (parsedUser.avatar_url) {
            const avatarUrlWithCache = `${parsedUser.avatar_url}?t=${Date.now()}`;
            const base64Image = await fetchAuthenticatedImage(avatarUrlWithCache);
            setAvatarBase64(base64Image);
          }
        } else {
          console.log("No user data found in storage");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  // Check if required fields are filled
  const isFormValid = () => {
    return name?.trim() && date && age >= 13;
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    // Validation
    if (!name?.trim()) {
      setSubmitError("Please enter your name");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (!date) {
      setSubmitError("Please select your date of birth");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (age && age < 13) {
      setSubmitError("You must be at least 13 years old");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const token = await loadToken();
      if (!token) throw new Error("Authentication token not found. Please log in again.");

      setAuthToken(token);

      // Format date of birth consistently
      let formattedDob = null;
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        const fixedDate = new Date(date);
        fixedDate.setHours(0, 0, 0, 0);
        formattedDob = fixedDate.toISOString();
      }

      const genderToSend = toBackendGender(gender);
      const smokingToSend = toBackendSmoking(smoking);
      const displayNameToSend = (name ?? "").trim();

      const avatarCandidate = avatarUri || user?.avatar_url || user?.photo_url || user?.imageUrl || null;
      
      const payload = {
        bio: (bio ?? "").trim() || null,
        date_of_birth: formattedDob,
        age: Number.isInteger(age) ? age : null,
        interests_note: (interests ?? "").trim() || null,
        job_title: jobTitle || null,
        languages: (selectedLanguage ?? "").trim() || null, 
      };

      // Send only when values exist
      if (genderToSend) payload.gender = genderToSend;
      if (smokingToSend) payload.smoking = smokingToSend;
      if (avatarCandidate) payload.avatar_url = avatarCandidate;
      if (displayNameToSend) payload.display_name = displayNameToSend;

      const response = await updateUserProfile(payload);
      console.log("Profile update response:", response);

      // Fetch fresh user profile from backend after update
      try {
        const fresh = await getUserProfile();
        
        if (fresh && fresh.data) {
          const userData = fresh.data;
          
          // Preserve existing fields like email when updating USER_DATA
          const existingRaw = await AsyncStorage.getItem("USER_DATA");
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          
          const mergedUser = {
            ...existing,
            ...userData,
            // Ensure email is preserved from existing if not in fresh data
            email: userData.email || existing.email,
          };
          
          setUser(mergedUser);
          await AsyncStorage.setItem("USER_DATA", JSON.stringify(mergedUser));
          
          // Clear local avatar URI and load fresh avatar from backend
          setAvatarUri(null);
          if (userData.avatar_url) {
            const avatarUrlWithCache = `${userData.avatar_url}?t=${Date.now()}`;
            const base64Image = await fetchAuthenticatedImage(avatarUrlWithCache);
            setAvatarBase64(base64Image);
          }
        }
      } catch (err) {
        console.error('[Information] Failed to fetch fresh profile:', err);
        // Fallback to manual merge if fetch fails
        const existingRaw = await AsyncStorage.getItem("USER_DATA");
        const existing = existingRaw ? JSON.parse(existingRaw) : {};

        const mergedUser = { ...existing, ...(user || {}), ...payload };
        if (displayNameToSend) {
          mergedUser.display_name = displayNameToSend;
        }
        if (!mergedUser.email && existing?.email) {
          mergedUser.email = existing.email;
        }
        setUser(mergedUser);
        await AsyncStorage.setItem("USER_DATA", JSON.stringify(mergedUser));
      }

      setSubmitSuccess("Profile updated successfully!");
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      // Auto navigate back after success in edit mode
      if (isEdit) {
        setTimeout(() => {
          // Use replace to force refresh the profile page
          router.replace("/profile");
        }, 500);
      } else {
        // First time setup - go to home
        setTimeout(() => {
          router.push("/home");
        }, 800);
      }
      
    } catch (error) {
      console.error("Profile update failed:", error);
      setSubmitError(error?.userMessage || error?.message || "Failed to update profile.");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      
      // Auto-dismiss error message after 3 seconds
      setTimeout(() => {
        setSubmitError(null);
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = user?.display_name || name || user?.email?.split('@')[0] || 'User';
  // Use base64 avatar if available, otherwise fallback to local URI or URL
  const avatarSource = avatarBase64 || avatarUri || user?.avatar_url || user?.photo_url || user?.imageUrl;

  const handleAvatarPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your avatar.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsCircularCrop: true, // Show circular crop frame on iOS
      });

      if (!result.canceled && result.assets[0]) {
        const newAvatarUri = result.assets[0].uri;
        // Show local image immediately
        setAvatarUri(newAvatarUri);
        setAvatarBase64(newAvatarUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleDatePress = () => {
    const initialDate = date || new Date();

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        is24Hour: true,
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) setDate(selectedDate);
        },
      });
      return;
    }

    setIosTempDate(initialDate);
    setShowIOSDatePicker(true);
  };

  const handleIOSDateChange = (_, selectedDate) => {
    if (selectedDate) setIosTempDate(selectedDate);
  };

  const closeIOSDatePicker = (shouldSave = false) => {
    if (shouldSave) setDate(iosTempDate);
    setShowIOSDatePicker(false);
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take a photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={[]}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>

            {/* Fixed Error/Success Messages at Top */}
            {(submitError || submitSuccess) && (
              <View style={{
                position: 'absolute',
                top: 10,
                left: 20,
                right: 20,
                zIndex: 1000,
                backgroundColor: submitError ? '#FFEBEE' : '#E8F5E9',
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: submitError ? '#B00020' : COLORS.primary,
              }}>
                <Text style={{ 
                  color: submitError ? '#B00020' : COLORS.primary, 
                  fontSize: 14,
                  fontWeight: '600'
                }}>
                  {submitError || submitSuccess}
                </Text>
              </View>
            )}

            {/* Header */}
            <View style={{
              backgroundColor: COLORS.redwine,
              paddingVertical: 24,
              paddingHorizontal: 20,
              marginBottom: 30,
            }}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
                  {avatarSource ? (
                    <Image source={{ uri: avatarSource }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: COLORS.redwine, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
                        {displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={handleAvatarPress}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.white}/>
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>
                    {user?.display_name || 'Welcome!'}
                  </Text>
                  <Text style={styles.usernameText}>
                    {user?.email || 'Complete your profile'}
                  </Text>
                </View>
              </View>
            </View>

          <Text style={styles.title}>{isEdit ? "Edit Profile" : "Complete Your Profile"}</Text>
          <Text style={styles.subtitle}>Tell us more about yourself</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="person-outline" size={16} color={COLORS.primary} /> Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="chatbox-outline" size={16} color={COLORS.primary} /> Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              autoCapitalize="sentences"
              placeholder="Tell us something about yourself..."
              placeholderTextColor="#999"
              style={[styles.textInput, styles.bioInput]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="language-outline" size={16} color={COLORS.primary} /> Languages
            </Text>
            <TouchableOpacity onPress={() => setShowLanguagePicker(true)} style={styles.selected}>
              <Text style={{ color: selectedLanguage ? COLORS.text : "#999", fontSize: 16 }}>
                {selectedLanguage || "Select languages you speak"}
              </Text>
              <Ionicons
                name={showLanguagePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <Modal visible={showLanguagePicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Select Language</Text>
                  <Picker
                    selectedValue={selectedLanguage}
                    onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                    itemStyle={{ color: '#222' }}
                  >
                    <Picker.Item label="Select your languages" value="" />
                    <Picker.Item label="Thai" value="Thai" />
                    <Picker.Item label="English" value="English" />
                    <Picker.Item label="Chinese (Simplified)" value="Chinese" />
                    <Picker.Item label="Japanese" value="Japanese" />
                    <Picker.Item label="Arabic" value="Arabic" />
                    <Picker.Item label="Bengali" value="Bengali" />
                    <Picker.Item label="French" value="French" />
                    <Picker.Item label="Russian" value="Russian" />
                    <Picker.Item label="Spanish" value="Spanish" />
                  </Picker>

                  <TouchableOpacity onPress={() => setShowLanguagePicker(false)} style={styles.confirmButtom}>
                    <Text style={{ color: "white" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} /> Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            {Platform.OS === "web" ? (
              <View style={styles.selected}>
                <WebDateInput
                  value={date}
                  onChange={(d) => setDate(d)}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.selected} onPress={handleDatePress}>
                <Text style={{ color: date ? COLORS.text : '#999', fontSize: 16 }}>
                  {date ? (() => {
                    const d = new Date(date);
                    const day = d.getDate();
                    const month = d.toLocaleString('en-US', { month: 'long' });
                    const year = d.getFullYear(); // This will be CE year
                    return `${day} ${month} ${year}`;
                  })() : "Select your birthday"}
                </Text>
                <Ionicons name='calendar' size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {Platform.OS === "ios" && (
            <Modal visible={showIOSDatePicker} transparent animationType="slide">
              <View style={styles.dateModalOverlay}>
                <View style={styles.dateModalCard}>
                  <DateTimePicker
                    value={iosTempDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={handleIOSDateChange}
                    themeVariant="light"
                    locale="en-US"
                  />

                  <View style={styles.dateModalActions}>
                    <TouchableOpacity
                      style={[styles.dateModalButton, styles.dateModalButtonSecondary]}
                      onPress={() => closeIOSDatePicker(false)}
                    >
                      <Text style={styles.dateModalButtonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateModalButton}
                      onPress={() => closeIOSDatePicker(true)}
                    >
                      <Text style={styles.dateModalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}


          <View style={styles.twoColRow}>
            {/* LEFT: Gender */}
            <View style={[styles.col, styles.inputGroup]}>
              <Text style={styles.label}>
                <Ionicons name="male-female-outline" size={16} color={COLORS.primary} /> Gender
              </Text>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(true)}
                style={[styles.selected, styles.genderSelected]}
                activeOpacity={0.8}
              >
                <Text style={{ color: gender ? COLORS.text : "#999", fontSize: 15 }}>
                  {gender ? genderLabel(gender) : "Select"}
                </Text>
                <Ionicons
                  name={showGenderPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              <Modal visible={showGenderPicker} transparent animationType="slide">
                <View style={styles.fillButtom}>
                  <View style={styles.fillBack}>
                    <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Select your sex
                    </Text>
                    <Picker selectedValue={gender} onValueChange={setGender} itemStyle={{ color: '#222' }}>
                      <Picker.Item label="Sex" value="" />
                      {GENDER_OPTIONS.map(opt => (
                        <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                      ))}
                    </Picker>

                    <TouchableOpacity
                      onPress={() => setShowGenderPicker(false)}
                      style={styles.confirmButtom}
                    >
                      <Text style={{ color: "white" }}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>

            {/* RIGHT: Age */}
            <View style={[styles.col, styles.inputGroup]}>
              <Text style={styles.label}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} /> Age
              </Text>
              <View style={[styles.ageDisplay]}>
                <Text style={{ color: age ? COLORS.text : "#999", fontSize: 16, fontWeight: '600' }}>
                  {Number.isInteger(age) ? `${age} years` : ""}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} /> Job Title
            </Text>
            <TouchableOpacity onPress={() => setShowJobTitlePicker(true)} style={styles.selected}>
              <Text style={{ color: jobTitle ? COLORS.text : "#999", fontSize: 16 }}>
                { jobTitle || "Select your occupation" }
              </Text>
              <Ionicons
                name={showjobTitlePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <Modal visible={showjobTitlePicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Select your job title</Text>
                  <Picker selectedValue={jobTitle} onValueChange={setJobTitle} itemStyle={{ color: '#222' }}>
                    <Picker.Item label="Select occupation" value="" />
                    <Picker.Item label="Student" value="Student" />
                    <Picker.Item label="Employee" value="Employee" />
                    <Picker.Item label="Freelancer" value="Freelancer" />
                    <Picker.Item label="Business Owner" value="Business Owner" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>

                  <TouchableOpacity onPress={() => setShowJobTitlePicker(false)} style={styles.confirmButtom}>
                    <Text style={{ color: "white" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="fitness-outline" size={16} color={COLORS.primary} /> Smoking
            </Text>
            <TouchableOpacity onPress={() => setShowSmokingPicker(true)} style={styles.selected}>
              <Text style={{ color: smoking ? COLORS.text : "#999", fontSize: 16 }}>
                {smokingLabel(smoking)}
              </Text>
              <Ionicons
                name={showSmokingPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <Modal visible={showSmokingPicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Are you smoking or not?</Text>
                  <Picker selectedValue={smoking} onValueChange={setSmoking} itemStyle={{ color: '#222' }}>
                    <Picker.Item label="Smoking or not" value="" />
                    {SMOKING_OPTIONS.map(opt => (
                      <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                  </Picker>

                  <TouchableOpacity onPress={() => setShowSmokingPicker(false)} style={styles.confirmButtom}>
                    <Text style={{ color: "white" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="heart-outline" size={16} color={COLORS.primary} /> Interests
            </Text>
            <TextInput
              value={interests}
              onChangeText={setInterests}
              autoCapitalize="sentences"
              placeholder="e.g., Travel, Photography, Hiking, Food..."
              placeholderTextColor="#999"
              style={styles.textInput}
            />
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.nextButton, 
              (isSubmitting || !isFormValid()) && { opacity: 0.5 }
            ]}
            disabled={isSubmitting || !isFormValid()}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.textNextButton}>{isEdit ? "Save Changes" : "Continue"}</Text>
                <Ionicons name={isEdit ? "checkmark" : "arrow-forward"} size={22} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>

        </View>
        
      </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}