import api from "../../../api/api";
import type { IContent, IContentListResponse } from "../types/content";

export const contentService = {
  getContentsByChapter: async (
    chapterId: string,
    page = 1,
    limit = 10,
  ): Promise<IContentListResponse> => {
    const response = await api.get<IContentListResponse>(
      `/content/chapter/${chapterId}?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getContentById: async (
    contentId: string,
  ): Promise<{ success: boolean; data: IContent }> => {
    const response = await api.get<{ success: boolean; data: IContent }>(
      `/content/${contentId}`,
    );
    return response.data;
  },
};
