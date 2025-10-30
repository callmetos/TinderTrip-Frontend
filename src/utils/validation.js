export const validateDisplayName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Display name is required' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }
  return { isValid: true, error: null };
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email' };
  }
  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  // เพิ่มเงื่อนไขความซับซ้อนของรหัสผ่าน
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasUpper && hasLower && hasNumber)) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase letters and numbers'
    };
  }
  
  return { 
    isValid: true, 
    error: null,
    strength: {
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      score: [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    }
  };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || !confirmPassword.trim()) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true, error: null };
};