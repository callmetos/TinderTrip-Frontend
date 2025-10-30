import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, { DateTimePickerAndroid, } from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from '../../assets/styles/info-styles.js';
import { COLORS } from '../../color/colors.js';
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx';

export default function InformationScreen() {
  const router = useRouter("");
  const [user, setUser] = useState(null);
  
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

    useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("USER_DATA");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          console.log("Loaded user:", JSON.parse(storedUser));
        } else {
          console.log("No user data found in storage");
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleNext = () => {
    console.log("Next button pressed!");
  };

  const avatarSource = user?.photo_url
    ? { uri: user.photo_url }
    : user?.imageUrl
    ? { uri: user.imageUrl }
    : require("../../assets/images/image 6.png");

  const handleAvatarPress = () => {
    // open image picker here
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
          if (event.type === "set" && selectedDate) {
            setDate(selectedDate);
          }
        },
      });

      return;
    }

    setIosTempDate(initialDate);
    setShowIOSDatePicker(true);
  };

  const handleIOSDateChange = (_, selectedDate) => {
    if (selectedDate) {
      setIosTempDate(selectedDate);
    }
  };

  const closeIOSDatePicker = (shouldSave = false) => {
    if (shouldSave) {
      setDate(iosTempDate);
    }

    setShowIOSDatePicker(false);
  };

  const handleCameraPress = () => {
    // open camera here
    console.log("Camera icon pressed");
  };


  return (
    <ProtectedRoute requireAuth={true}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        //extraScrollHeight={100}
      >
      <View style={styles.container}>

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
                  <Ionicons name="camera-outline" size={20} color = {COLORS.white}/>
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
              <Text style={{ color: selectedLanguage ? COLORS.text : "#999", fontSize: 16, }}>
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
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                  Select Language
                </Text>
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

                <TouchableOpacity
                  onPress={() => setShowLanguagePicker(false)}
                  style={styles.confirmButtom}
                >
                  <Text style={{ color: "white" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        <Text style={styles.text}>Date of Birth:</Text>
        <TouchableOpacity
          style={styles.selected}
          onPress={handleDatePress}
        >
          <Text style={{ color: date ? COLORS.text : '#999', fontSize: 16 }}>
            {date ? date.toDateString() : "Select your birthday"}
          </Text>
          <Ionicons name='calendar-outline' size={20} color= '#999' />
        </TouchableOpacity>

        {Platform.OS === "ios" && (
          <Modal
            visible={showIOSDatePicker}
            transparent
            animationType="slide"
          >
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

  
        <Text style={styles.text}>Gender:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowGenderPicker(true)} style={[styles.selected, styles.genderAgeSelected]}>
              <Text style={{ color: gender ? COLORS.text : "#999", fontSize: 16, }}>
                { gender || "Sex"}
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
                <Picker
                  selectedValue={gender}
                  onValueChange={(itemValue) => setGender(itemValue)}
                >
                  <Picker.Item label="Sex" value="" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Prefer Not Say" value="Prefer-Not-Say" />
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

        <View style={styles.box}>
          <Text style={styles.text}>Age:</Text>
          <TextInput
            value={age}
            onChangeText={setAge}
            autoCapitalize="none"
            placeholder="age"
            style={[styles.textInput, styles.genderAgeSelected]}
          />
        </View>

        <Text style={styles.text}>Job Title:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowJobTitlePicker(true)} style={[styles.selected]}>
              <Text style={{ color: jobTitle ? COLORS.text : "#999", fontSize: 16, }}>
                { jobTitle || "ex. Graduated"}
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
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                  Select your job title
                </Text>
                <Picker
                  selectedValue={jobTitle}
                  onValueChange={(itemValue) => setJobTitle(itemValue)}
                >
                  <Picker.Item label="job title" value="" />
                  <Picker.Item label="Graduated" value="Graduated" />
                  <Picker.Item label="Undergraduate" value="Undergraduate" />
                  <Picker.Item label="Business Owner" value="Business-Owner" />
                  <Picker.Item label="Freelancer" value="Freelancer" />
                  <Picker.Item label="Employee" value="Employee" />
                  <Picker.Item label="Other" value="Other" />
                </Picker>

                <TouchableOpacity
                  onPress={() => setShowJobTitlePicker(false)}
                  style={styles.confirmButtom}
                >
                  <Text style={{ color: "white" }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>


        <Text style={styles.text}>Smoking:</Text>
          <View>
            <TouchableOpacity onPress={() => setShowSmokingPicker(true)} style={[styles.selected]}>
              <Text style={{ color: smoking ? COLORS.text : "#999", fontSize: 16, }}>
                { smoking || "ex. non-smoking"}
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
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                  Are you smoking or not?
                </Text>
                <Picker
                  selectedValue={smoking}
                  onValueChange={(itemValue) => setSmoking(itemValue)}
                >
                  <Picker.Item label="Smoking" value="Smoking" />
                  <Picker.Item label="Non-smoking" value="Non-smoking" />
                  <Picker.Item label="Sometime" value="Sometime" />
                </Picker>

                <TouchableOpacity
                  onPress={() => setShowSmokingPicker(false)}
                  style={styles.confirmButtom}
                >
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

        <TouchableOpacity onPress={handleNext} style={styles.nextButton} >
          <Text
            style={styles.textNextButton}
          >Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#5A1D1D" />
        </TouchableOpacity>

        <Link href="/create-trip" asChild>
          <Text style = {styles.linkText} >Skip<Ionicons name="play-skip-forward-outline" ></Ionicons></Text>
        </Link>
        

      </View>
      </KeyboardAwareScrollView>
    </ProtectedRoute>
  );
}
