import api from "../../../api/api";
import type { ICategoryResponse } from "../types/category";

export const categoryService = {
  getAllCategories: async (
    page = 1,
    limit = 100,
  ): Promise<ICategoryResponse> => {
    const response = await api.get("/category/public/all", {
      params: { page, limit },
    });
    return response.data;
  },
};
