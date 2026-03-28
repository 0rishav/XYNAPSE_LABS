export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface UserDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string; 
  gender?: "Male" | "Female" | "Other";
  city?: string;
  country?: string;
  role: string;
  image?: string;
  referralCode: string;
  socialMedia?: SocialLinks
  preferences: {
    theme: "dark" | "light" | "system";
    language: string;
  };
  codingStats: {
    level: string;
    points: number;
    solvedChallenges: number;
  };
  createdAt: string;
}

export interface GetUserResponse {
  success: boolean;
  message: string;
  data: {
    user: UserDetails;
  };
}

export interface UpdateUserDetailsRequest {
  name?: string;
  phone?: string;
  gender?: "Male" | "Female" | "Other";
  country?: string;
  city?: string;
  image?: File | null;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  data: {
    user: UserDetails;
  };
}

export interface UpdateSocialResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    socialMedia: SocialLinks;
  };
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}
