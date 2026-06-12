export interface IMCQOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface IMCQQuestion {
  _id: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  options: IMCQOption[];
  multipleCorrect: boolean;
  marks: number;
  negativeMarks: number;
  chapterId: string;
  paperId?: string;
  accessLevel: 'free' | 'standard' | 'premium';
  status: 'draft' | 'published' | 'archived';
}

export interface ListMCQQuestionsResponse {
  success: boolean;
  message: string;
  data: {
    mcqs: IMCQQuestion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}