import api from "../../../api/api";
import type {
  ICreateReviewPayload,
  IGetReviewsResponse,
  ILikeReviewResponse,
  IReviewActionResponse,
  IUpdateReviewPayload,
  ReviewSortType,
} from "../types/review";

export const reviewService = {
  getCourseReviews: async (
    courseId: string,
    page: number = 1,
    limit: number = 10,
    sort: ReviewSortType = "newest",
  ): Promise<IGetReviewsResponse> => {
    try {
      const response = await api.get<IGetReviewsResponse>(
        `/review/${courseId}`,
        {
          params: { page, limit, sort },
        },
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch reviews",
        data: {
          reviews: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        },
      };
    }
  },

  createReview: async (
    courseId: string,
    payload: ICreateReviewPayload,
  ): Promise<IReviewActionResponse> => {
    try {
      const response = await api.post<IReviewActionResponse>(
        `/review/${courseId}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to submit review",
        // @ts-ignore
        data: null,
      };
    }
  },

  updateReview: async (
    reviewId: string,
    payload: IUpdateReviewPayload,
  ): Promise<IReviewActionResponse> => {
    try {
      const response = await api.patch<IReviewActionResponse>(
        `/review/${reviewId}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update review",
        // @ts-ignore
        data: null,
      };
    }
  },

  deleteReview: async (
    reviewId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/review/${reviewId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete review",
      };
    }
  },

  likeReview: async (reviewId: string): Promise<ILikeReviewResponse> => {
    try {
      const response = await api.patch<ILikeReviewResponse>(
        `/review/${reviewId}/like`,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to like review",
        data: { likesCount: 0 },
      };
    }
  },
};
