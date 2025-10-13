// Auth related interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface RegisterResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
  data?: {
    token: string;
    user?: {
      id: string;
      email: string;
      display_name: string;
    };
  };
}

export interface GoogleAuthResponse {
  auth_url: string;
  state: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface VerifyEmailRequest {
  display_name: string;
  email: string;
  otp: string;
  password: string;
}

export interface Profile {
  avatar_url: string;
  bio: string;
  created_at: string;
  date_of_birth: string;
  gender: string;
  home_location: string;
  id: string;
  interests_note: string;
  job_title: string;
  languages: string;
  smoking: string;
  updated_at: string;
  user_id: string;
}

export interface VerifyEmailResponse {
  token: string;
  user: {
    created_at: string;
    display_name: string;
    email: string;
    id: string;
    profile: Profile;
    provider: string;
  };
}
