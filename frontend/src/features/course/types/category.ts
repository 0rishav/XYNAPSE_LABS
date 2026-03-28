export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategoryResponse {
  success: boolean;
  message: string;
  data: {
    categories: ICategory[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}