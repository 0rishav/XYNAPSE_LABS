import api from "../../../api/api";
import type { ListMCQPapersResponse } from "../types/mcqPaper";


export const mcqPaperService = {
  getPapersByChapter: async (chapterId: string): Promise<ListMCQPapersResponse> => {
    try {
      const response = await api.get<ListMCQPapersResponse>(`/mcqPaper/list`, {
        params: { 
          chapterId: chapterId,
          status: "published" 
        },
      });
      return response.data;
    } catch (error) {
      console.error("SERVICE_ERROR: Failed to fetch MCQ Papers", error);
      throw error;
    }
  },
};