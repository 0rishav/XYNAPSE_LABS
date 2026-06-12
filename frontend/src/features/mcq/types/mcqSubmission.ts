export interface IAnswer {
  questionId: string;
  selectedOptions: number[];
  isCorrect?: boolean;
  marksAwarded?: number;
  timeTaken?: number;
}

export interface ISubmissionPayload {
  chapterId: string;
  courseId: string;
  paperId: string;
  mode: 'practice' | 'contest';
  answers: IAnswer[];
}

export interface ISubmissionResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    userId: string;
    paperId: string;
    totalScore: number;
    correctAnswers: number;
    wrongAnswers: number;
    status: string;
    submittedAt: Date;
  };
}