import api from "../../../api/api";
import type {
  AuthResponse,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyOtpResponse,
} from "../types/auth";

export const authService = {
  register: async (
    data: RegisterPayload,
    refCode: string | null,
  ): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    if (data.password) formData.append("password", data.password);
    if (data.confirmPassword)
      formData.append("confirmPassword", data.confirmPassword);
    if (data.profilePic) formData.append("image", data.profilePic);

    const url = refCode ? `/auth/register?ref=${refCode}` : "/auth/register";
    const response = await api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  activate: async (activation_code: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/activate-user", { activation_code });
    return response.data;
  },

  login: async (loginData: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", loginData);
    return response.data;
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await api.post("/auth/generate-reset-token", { email });
    return response.data;
  },

  verifyResetOtp: async (otp_code: string): Promise<VerifyOtpResponse> => {
    const response = await api.post("/auth/verify-reset-otp", { otp_code });
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<ForgotPasswordResponse> => {
    const response = await api.post("/auth/new-password", payload);
    return response.data;
  },
};
