import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../../src/api/client.js';


export async function login(email, password) {
  const res = await api.post('/api/v1/auth/login', { email, password });
  const response = res.data;
  
  // เก็บ token ลง AsyncStorage
  setAuthToken(response.token);
  await AsyncStorage.setItem('TOKEN', response.token);
  
  return response;
}

export async function getGoogleAuthUrl() {
  const res = await api.get('api/v1/auth/google');
  return res.data;
}

export async function register(email, password, display_name) {
  const res = await api.post('/api/v1/auth/register', { 
    email, 
    password, 
    display_name 
  });
  return res.data;
}

export async function bootstrapToken() {
  const token = await AsyncStorage.getItem('TOKEN');
  setAuthToken(token);
  return token;
}

export async function me() {
  const res = await api.get('/v1/me');
  return res.data?.data;
}

export async function resendVerification(email) {
  const res = await api.post('/api/v1/auth/resend-verification', { email });
  return res.data;
}

export async function verifyEmail(email, otp, password, display_name) {
  const res = await api.post('/api/v1/auth/verify-email', {
    email,
    otp,
    password,
    display_name
  });
  return res.data;
}

export async function verifyOPT(email, otp) {
  const res = await api.post('/api/v1/auth/verify-otp', {
    email,
    otp,

  });
  return res.data;
}

