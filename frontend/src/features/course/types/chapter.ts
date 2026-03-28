export interface IChapter {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  isPreview: boolean;
  status: "published" | "draft";
  estimatedDurationMinutes: number;
  totalMcqs: number;
  totalProblems: number;
  isDeleted: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IGetChaptersResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    chapters: IChapter[];
  };
}