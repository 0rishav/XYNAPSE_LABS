export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  referralCode?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  requires2FA?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePic?: File | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;   
  deviceName?: string; 
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string; 
  };
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}