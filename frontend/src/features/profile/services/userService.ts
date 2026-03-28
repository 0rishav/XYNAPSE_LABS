import api from "../../../api/api";
import type {
  GetUserResponse,
  UpdatePasswordResponse,
  UpdateSocialResponse,
  UpdateUserDetailsRequest,
  UpdateUserResponse,
} from "../types/user";

export const userService = {
  getProfile: async (): Promise<GetUserResponse> => {
    const response = await api.get<GetUserResponse>("/auth/me");
    return response.data;
  },

  updateProfile: async (
    updateData: UpdateUserDetailsRequest,
  ): Promise<UpdateUserResponse> => {
    const formData = new FormData();

    if (updateData.name) formData.append("name", updateData.name);
    if (updateData.phone) formData.append("phone", updateData.phone);
    if (updateData.gender) formData.append("gender", updateData.gender);
    if (updateData.country) formData.append("country", updateData.country);
    if (updateData.city) formData.append("city", updateData.city);

    if (updateData.image) {
      formData.append("image", updateData.image);
    }

    const response = await api.patch<UpdateUserResponse>(
      "/auth/user/edit-profile",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },

  updateSocialLinks: async (socialData: {
    linkedin: string;
    github: string;
    twitter: string;
  }): Promise<UpdateSocialResponse> => {
    const response = await api.patch<UpdateSocialResponse>(
      "/auth/user/social-accounts",
      socialData,
    );
    return response.data;
  },

  updatePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<UpdatePasswordResponse> => {
    const response = await api.patch<UpdatePasswordResponse>(
      "/auth/user/update-password",
      passwordData,
    );

    return response.data;
  },
};
