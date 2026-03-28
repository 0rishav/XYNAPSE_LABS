import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCQQuestion",
      required: true,
    },
    selectedOptions: [{ type: Number }],
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
  },
  { _id: false },
);

const mcqSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    chapterId: { type: String, required: false, index: true },
    courseId: { type: String, required: false, index: true },

    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCQPaper",
      required: true,
      index: true,
    },

    mode: {
      type: String,
      enum: ["practice", "contest"],
      default: "practice",
      index: true,
    },
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCQPaper",
      required: false,
      index: true,
    },

    answers: [answerSchema],

    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },

    attemptNumber: { type: Number, default: 1 },
    isFinal: { type: Boolean, default: true },

    submittedAt: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["in-progress", "submitted", "evaluated"],
      default: "submitted",
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

mcqSubmissionSchema.index({ userId: 1, paperId: 1, attemptNumber: -1 });
mcqSubmissionSchema.index({ courseId: 1, chapterId: 1, userId: 1 });
mcqSubmissionSchema.index({ contestId: 1, userId: 1 });

const MCQSubmission = mongoose.model("MCQSubmission", mcqSubmissionSchema);
export default MCQSubmission;
