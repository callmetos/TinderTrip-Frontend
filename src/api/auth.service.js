import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../../src/api/client.js';


export async function login(email, password) {
  try {
    if (__DEV__) console.log('[auth.service] Logging in:', email);
    const res = await api.post('/api/v1/auth/login', { email, password });
    
    if (__DEV__) {
      console.log('[auth.service] Raw response:', {
        status: res.status,
        hasData: !!res.data,
        dataKeys: res.data ? Object.keys(res.data) : [],
      });
    }
    
    const response = res.data;
    
    // Backend อาจส่ง token มาใน response.data แทน response.token
    const token = response?.token || response?.data?.token;
    const user = response?.user || response?.data?.user || response?.data;
    
    if (__DEV__) {
      console.log('[auth.service] Processed:', {
        hasToken: !!token,
        hasUser: !!user,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      });
    }
    
    // ต้องมี token ถึงจะถือว่าสำเร็จ
    if (!token) {
      const message = response?.message || response?.error || 'Login failed: token missing';
      if (__DEV__) console.error('[auth.service] No token in response:', response);
      const err = new Error(message);
      err.response = { data: response };
      err.userMessage = message;
      throw err;
    }

    // เก็บ token ลง AsyncStorage
    setAuthToken(token);
    await AsyncStorage.setItem('TOKEN', token);
    
    // Return normalized response
    return {
      token,
      user: user || { email }, // fallback to email if no user object
      ...response
    };
  } catch (error) {
    if (__DEV__) {
      console.error('[auth.service] Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    
    // Attach user-friendly message
    if (error.response?.status === 401) {
      error.userMessage = 'Invalid email or password';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Account not found';
    } else if (!error.userMessage) {
      error.userMessage = error.response?.data?.message || error.message;
    }
    
    throw error;
  }
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
    otp
  });
  return res.data;
}

export async function forgetPassword(email) {
  const res = await api.post('/api/v1/auth/forgot-password', {
    email
  });
  return res.data;
}

export async function resetPassword(email, otp, password) {
  const res = await api.post('/api/v1/auth/reset-password', {
    email,
    otp,
    password
  });
  return res.data;
}

// TODO: รอ backend สร้าง API endpoint นี้
// Expected Response Format (ตามมาตรฐานโปรเจค):
// {
//   "data": {
//     "setup_completed": true/false
//   },
//   "message": "Setup status retrieved successfully"
// }
export async function getSetupStatus() {
  const res = await api.get('/api/v1/users/setup-status');
  return res.data;
}

