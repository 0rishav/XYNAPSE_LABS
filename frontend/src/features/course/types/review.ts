export interface IReview {
  _id: string;
  courseId: string;
  userId: string;
  rating: number;
  reviewText: string;
  likesCount: number;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    image: string | null;
    role: string;
  };
}

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IGetReviewsResponse {
  success: boolean;
  message: string;
  data: {
    reviews: IReview[];
    pagination: IPagination;
  };
}

export interface IReviewActionResponse {
  success: boolean;
  message: string;
  data: IReview;
}

export interface ILikeReviewResponse {
  success: boolean;
  message: string;
  data: {
    likesCount: number;
  };
}

export interface ICreateReviewPayload {
  rating: number;
  reviewText: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  reviewText?: string;
}

export type ReviewSortType = "newest" | "helpful";
