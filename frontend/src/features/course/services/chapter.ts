import api from "../../../api/api";
import type { IGetChaptersResponse } from "../types/chapter";

export const chapterService = {
  getChaptersByCourse: async (
    courseId: string,
  ): Promise<IGetChaptersResponse> => {
    try {
      const response = await api.get<IGetChaptersResponse>(
        `/chapter/course/${courseId}`,
      );

      return response.data;
    } catch (error: any) {
      console.error("Chapter Fetch Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Mission intel fetch failed",
        data: { count: 0, chapters: [] },
      };
    }
  },
};
