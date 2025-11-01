import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'TOKEN',
  EMAIL: 'EMAIL',
  DISPLAY_NAME: 'DISPLAY_NAME',
  PASSWORD: 'PASSWORD',
  VERIFY_REGISTER: 'VERIFY_REGISTER',
  OTP: 'OTP',

  NAME: 'NAME',
  BIO: 'BIO',
  LANGUAGES: 'LANGUAGES',
  DATE_OF_BIRTH: 'DATE_OF_BIRTH',
  GENDER: 'GENDER',
  AGE: 'AGE',
  JOB_TITLE: 'JOB_TITLE',
  SMOKING: 'SMOKING',
  INTERESTS: 'INTERESTS'
};

export async function saveToken(token) {
  if (token) {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  } else {
    await AsyncStorage.removeItem(KEYS.TOKEN);
  }
}

export async function loadToken() {
  return AsyncStorage.getItem(KEYS.TOKEN);
}

export async function clearToken() {
  await AsyncStorage.removeItem(KEYS.TOKEN);
}

export async function saveEmail(email) {
  if (email) {
    await AsyncStorage.setItem(KEYS.EMAIL, email);
  } else {
    await AsyncStorage.removeItem(KEYS.EMAIL);
  }
}

export async function loadEmail() {
  return AsyncStorage.getItem(KEYS.EMAIL);
}

export async function clearEmail() {
  await AsyncStorage.removeItem(KEYS.EMAIL);
}

export async function saveDisplayName(displayName) {
  if (displayName) {
    await AsyncStorage.setItem(KEYS.DISPLAY_NAME, displayName);
  } else {
    await AsyncStorage.removeItem(KEYS.DISPLAY_NAME);
  }
}

export async function loadDisplayName() {
  return AsyncStorage.getItem(KEYS.DISPLAY_NAME);
}

export async function clearDisplayName() {
  await AsyncStorage.removeItem(KEYS.DISPLAY_NAME);
}

export async function saveVerifyRegister(verifyRegister) {
  await AsyncStorage.setItem(KEYS.VERIFY_REGISTER, verifyRegister.toString());
}

export async function loadVerifyRegister() {
  const value = await AsyncStorage.getItem(KEYS.VERIFY_REGISTER);
  return value === 'true';
}

export async function clearVerifyRegister() {
  await AsyncStorage.removeItem(KEYS.VERIFY_REGISTER);
}

export async function savePassword(password) {
  if (password) {
    await AsyncStorage.setItem(KEYS.PASSWORD, password);
  } else {
    await AsyncStorage.removeItem(KEYS.PASSWORD);
  }
}

export async function loadPassword() {
  return AsyncStorage.getItem(KEYS.PASSWORD);
}

export async function clearPassword() {
  await AsyncStorage.removeItem(KEYS.PASSWORD);
}

export async function saveOTP(otp) {
  if (otp) {
    await AsyncStorage.setItem(KEYS.OTP, otp);
  } else {
    await AsyncStorage.removeItem(KEYS.OTP);
  }
}

export async function loadOTP() {
  return AsyncStorage.getItem(KEYS.OTP);
}

export async function clearOTP() {
  await AsyncStorage.removeItem(KEYS.OTP);
}

//information
