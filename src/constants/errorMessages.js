export const ERROR_MESSAGES = {
  // Validation errors
  DISPLAY_NAME_REQUIRED: "Please enter display name",
  EMAIL_REQUIRED: "Please enter email",
  EMAIL_INVALID: "Please enter a valid email",
  PASSWORD_REQUIRED: "Please enter password",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORDS_NOT_MATCH: "Passwords do not match",
  
  // Server errors
  EMAIL_EXISTS: "An account with this email already exists",
  NETWORK_ERROR: "Connection failed. Please check your internet connection",
  SERVER_ERROR: "Something went wrong. Please try again later",
  
  // API response codes
  CONFLICT: "EMAIL_EXISTS",
  BAD_REQUEST: "SERVER_ERROR",
  UNAUTHORIZED: "SERVER_ERROR"
};