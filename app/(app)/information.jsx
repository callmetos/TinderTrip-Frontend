import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from '../../assets/styles/info-styles.js';
import { COLORS } from '../../color/colors.js';
import { setAuthToken } from '../../src/api/client.js';
import { updateUserProfile } from '../../src/api/info.service.js';
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx';
import { loadToken } from '../../src/lib/storage.js';


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
          padding: "0 36px 0 14px", // เผื่อที่ให้ไอคอน
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      />
      {/* ไอคอนปฏิทินวางทับขวา */}
      <div style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }}>
        <Ionicons name="calendar-outline" size={20} color="#999" />
      </div>
    </div>
  );
};


export default function InformationScreen() {
  const [user, setUser] = useState(null);
  const router = useRouter();

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    if (!date) { setAge(null); return; }
    const today = new Date();
    const dob = new Date(date);
    let a = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--;
    setAge(a); 
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
              ? int(parsedUser.age)
              : ""
          );

          setGender(toBackendGender(parsedUser.gender));
          setJobTitle(parsedUser.job_title ?? "");
          setSmoking(toBackendSmoking(parsedUser.smoking));
          setInterests(parsedUser.interests_note ?? "");
        } else {
          console.log("No user data found in storage");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleNext = async () => {
    if (isSubmitting) return;

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const token = await loadToken();
      if (!token) throw new Error("Authentication token not found. Please log in again.");

      setAuthToken(token);

      let formattedDob = "";

      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        // clone date object, set time to 00:00:00 (local)
        const fixedDate = new Date(date);
        fixedDate.setHours(0, 0, 0, 0);
        formattedDob = fixedDate.toISOString(); // full ISO string e.g. "2025-11-01T00:00:00.000Z"
      } else if (typeof date === "string" && date.trim()) {
        // convert from "YYYY-MM-DD" string to Date then ISO
        const parsed = new Date(`${date}T00:00:00Z`);
        formattedDob = parsed.toISOString();
      } else {
        formattedDob = null; // ส่ง null ถ้าไม่มีวันเกิด
      }

      const genderToSend  = toBackendGender(gender);
      const smokingToSend = toBackendSmoking(smoking);

      const payload = {
        avatar_url: user?.avatar_url ?? user?.photo_url ?? user?.imageUrl ?? "",
        bio: (bio ?? "").trim(),
        date_of_birth: formattedDob,
        gender: genderToSend,           
        age: age || "",
        interests_note: (interests ?? "").trim(),
        job_title: jobTitle || "",
        languages: (selectedLanguage ?? "").trim(), 
        smoking: smokingToSend,         
      };

      const response = await updateUserProfile(payload);
      console.log("Profile update response:", response);

      const mergedUser = { ...(user || {}), ...payload };
      setUser(mergedUser);
      await AsyncStorage.setItem("USER_DATA", JSON.stringify(mergedUser));

      setSubmitSuccess("Profile updated successfully.");
      
    } catch (error) {
      console.error("Profile update failed:", error);
      setSubmitError(error?.userMessage || error?.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
  if (isSubmitting) return;

  setSubmitError(null);
  setSubmitSuccess(null);
  setIsSubmitting(true);

  try {
    const token = await loadToken();
    if (!token) throw new Error("Authentication token not found. Please log in again.");

    setAuthToken(token);

    const payload = {
      // ถ้าต้องการเก็บ avatar เดิม ให้คงค่าไว้; ถ้าอยากล้างก็ใส่ null
      avatar_url: user?.avatar_url ?? user?.photo_url ?? user?.imageUrl ?? null,

      bio: null,
      date_of_birth: null,
      gender: null,
      age: null,
      interests_note: null,
      job_title: null,
      languages: null,
      smoking: null,
    };

    // เรียก API ขาเดิม
    await updateUserProfile(payload);

    // sync ค่าใน storage ให้ตรงกับที่ส่ง (null)
    const mergedUser = { ...(user || {}), ...payload };
    setUser(mergedUser);
    await AsyncStorage.setItem("USER_DATA", JSON.stringify(mergedUser));

    // ไปหน้าถัดไป
    router.push("/home");
  } catch (error) {
    console.error("Skip update failed:", error);
    setSubmitError(error?.userMessage || error?.message || "Failed to skip and update profile.");
  } finally {
    setIsSubmitting(false);
  }
};

  const avatarSource = user?.photo_url
    ? { uri: user.photo_url }
    : user?.imageUrl
    ? { uri: user.imageUrl }
    : require("../../assets/images/image 6.png"); 

  const handleAvatarPress = () => {
    console.log("Change avatar pressed");
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

  const handleCameraPress = () => {
    console.log("Camera icon pressed");
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
      >
        <View style={styles.container}>

          {submitError && (
            <Text style={{ color: '#B00020', marginHorizontal: 40, marginBottom: 12 }}>
              {submitError}
            </Text>
          )}

          {submitSuccess && (
            <Text style={{ color: COLORS.primary, marginHorizontal: 40, marginBottom: 12 }}>
              {submitSuccess}
            </Text>
          )}

          {/* Header */}
          <View style ={{
            backgroundColor: COLORS.redwine,
            height: 100,
            borderRadius: 45,
            marginBottom: 10
          }}>
            <View style = {styles.headerLeft}>
              <TouchableOpacity onPress={handleAvatarPress}>
                <Image source={avatarSource} style={styles.avatar} />
                <TouchableOpacity style={styles.editButton} onPress={handleCameraPress}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.white}/>
                </TouchableOpacity>
              </TouchableOpacity>

              <View style = {styles.welcomeContainer}>
                <Text style = {styles.welcomeText}>Hello, {user?.display_name}</Text>
                <Text style = {styles.usernameText}>
                  { user?.email?.split("@")[0] || 'User'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.title}>Information</Text>

          <Text style={styles.text}>Name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            placeholder="Meow Meow"
            style={styles.textInput}
          />

          <Text style={styles.text}>Bio:</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            autoCapitalize="none"
            placeholder="I love cat"
            style={styles.textInput}
          />

          <Text style={styles.text}>Languages:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowLanguagePicker(true)} style={styles.selected}>
              <Text style={{ color: selectedLanguage ? COLORS.text : "#999", fontSize: 16 }}>
                {selectedLanguage || "Select your language"}
              </Text>
              <Ionicons
                name={showLanguagePicker ? "caret-up-outline" : "caret-down-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            <Modal visible={showLanguagePicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Select Language</Text>
                  <Picker
                    selectedValue={selectedLanguage}
                    onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
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

          <Text style={styles.text}>Date of Birth:</Text>
          {Platform.OS === "web" ? (
            // เว็บ: ใช้ input type="date"
            <View style={styles.selected}>
              <WebDateInput
                value={date}
                onChange={(d) => setDate(d)}
              />
            </View>
          ) : (
          <TouchableOpacity style={styles.selected} onPress={handleDatePress}>
            <Text style={{ color: date ? COLORS.text : '#999', fontSize: 16 }}>
              {date ? date.toDateString() : "Select your birthday"}
            </Text>
            <Ionicons name='calendar-outline' size={20} color='#999' />
          </TouchableOpacity> )}

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
            <View style={styles.col}>
              <Text style={styles.text}>Gender:</Text>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(true)}
                style={[styles.selected, styles.genderSelected]}
                activeOpacity={0.8}
              >
                <Text style={{ color: gender ? COLORS.text : "#999", fontSize: 16 }}>
                  {gender ? genderLabel(gender) : "Select gender"}
                </Text>
                <Ionicons
                  name={showGenderPicker ? "caret-up-outline" : "caret-down-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              <Modal visible={showGenderPicker} transparent animationType="slide">
                <View style={styles.fillButtom}>
                  <View style={styles.fillBack}>
                    <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                      Select your sex
                    </Text>
                    <Picker selectedValue={gender} onValueChange={setGender}>
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
            <View style={[styles.col]}>
              <Text style={styles.text}>Age:</Text>
              <TextInput
                value={Number.isInteger(age) ? String(age) : ""}  // ✅ แปลงเป็น string ตอนโชว์
                editable={false}
                selectTextOnFocus={false}
                placeholder="age"
                style={[styles.textInput, styles.AgeSelected]}
              />
            </View>
          </View>

          <Text style={styles.text}>Job Title:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowJobTitlePicker(true)} style={styles.selected}>
              <Text style={{ color: jobTitle ? COLORS.text : "#999", fontSize: 16 }}>
                { jobTitle || "ex. Graduated" }
              </Text>
              <Ionicons
                name={showjobTitlePicker ? "caret-up-outline" : "caret-down-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            <Modal visible={showjobTitlePicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Select your job title</Text>
                  <Picker selectedValue={jobTitle} onValueChange={setJobTitle}>
                    <Picker.Item label="job title" value="" />
                    <Picker.Item label="Graduated" value="Graduated" />
                    <Picker.Item label="Undergraduate" value="Undergraduate" />
                    <Picker.Item label="Business Owner" value="Business-Owner" />
                    <Picker.Item label="Freelancer" value="Freelancer" />
                    <Picker.Item label="Employee" value="Employee" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>

                  <TouchableOpacity onPress={() => setShowJobTitlePicker(false)} style={styles.confirmButtom}>
                    <Text style={{ color: "white" }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <Text style={styles.text}>Smoking:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowSmokingPicker(true)} style={styles.selected}>
              <Text style={{ color: smoking ? COLORS.text : "#999", fontSize: 16 }}>
                {smokingLabel(smoking) /* แสดงเป็น Non-smoking/Sometime ฯลฯ */}
              </Text>
              <Ionicons
                name={showSmokingPicker ? "caret-up-outline" : "caret-down-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            <Modal visible={showSmokingPicker} transparent animationType="slide">
              <View style={styles.fillButtom}>
                <View style={styles.fillBack}>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Are you smoking or not?</Text>
                  <Picker selectedValue={smoking} onValueChange={setSmoking}>
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

          <Text style={styles.text}>Interests:</Text>
          <TextInput
            value={interests}
            onChangeText={setInterests}
            autoCapitalize="none"
            placeholder="ex. play game"
            style={styles.textInput}
          />

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, isSubmitting && { opacity: 0.7 }]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#5A1D1D" />
            ) : (
              <>
                <Text style={styles.textNextButton}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#5A1D1D" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.linkText}>
              Skip<Ionicons name="play-skip-forward-outline" />
            </Text>
          </TouchableOpacity>

        </View>
        
      </KeyboardAwareScrollView>
    </ProtectedRoute>
  );
}