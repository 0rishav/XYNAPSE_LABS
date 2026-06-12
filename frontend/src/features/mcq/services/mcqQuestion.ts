import api from "../../../api/api";
import type { ListMCQQuestionsResponse } from "../types/mcqQuestion";

interface MCQQueryParams {
  paperId?: string;
  chapterId?: string;
  difficulty?: string;
  tags?: string; 
  page?: number;
  limit?: number;
}

export const mcqQuestionService = {

  getQuestions: async (params: MCQQueryParams): Promise<ListMCQQuestionsResponse> => {
    try {
      const response = await api.get<ListMCQQuestionsResponse>(`/mcqQuestion/all`, {
        params: { 
          ...params,
          page: params.page || 1,
          limit: params.limit || 10 
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};