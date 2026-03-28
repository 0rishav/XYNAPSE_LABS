import type { ICategory } from "./category";

export interface ICourse {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnail: string;
  categoryId: Pick<ICategory, "_id" | "name" | "slug">;
  parentCourse: string | null; 
  type: "theory" | "practical"; 
  level: "beginner" | "intermediate" | "advanced"; 
  badges: string[]; 
  tags: string[];
  isPublished: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICourseResponse {
  success: boolean;
  message: string;
  data: {
    courses: ICourse[];
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

export interface ICourseFilters {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
}