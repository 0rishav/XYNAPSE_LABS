import api from "../../../api/api";
import type { ICourseFilters, ICourseResponse } from "../types/course";

export const courseService = {
  getAllCourses: async (
    filters: ICourseFilters = {},
  ): Promise<ICourseResponse> => {
    const { page = 1, limit = 10, type, categoryId } = filters;

    const response = await api.get("/course/public/all", {
      params: {
        page,
        limit,
        ...(type && { type }),
        ...(categoryId && { categoryId }),
      },
    });

    return response.data;
  },
};
