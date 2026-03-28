import api from "../../../api/api";
import type { IGetCourseIntroResponse } from "../types/courseIntro";

export const courseIntroService = {
  getCourseIntro: async (
    courseId: string,
  ): Promise<IGetCourseIntroResponse> => {
    try {
      const response = await api.get<IGetCourseIntroResponse>(
        `/courseIntro/${courseId}`,
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch mission briefing",
        data: {} as any,
      };
    }
  },
};
