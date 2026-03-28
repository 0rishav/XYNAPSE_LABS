import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String },
  },
  { _id: false },
);

const mcqQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },

    tags: [{ type: String, trim: true, index: true }],

    options: [optionSchema],
    multipleCorrect: { type: Boolean, default: false },

    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },

    chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCQPaper",
      required: false,
      index: true,
    }, // Paper reference

    accessLevel: {
      type: String,
      enum: ["free", "standard", "premium"],
      default: "free",
      index: true,
    },

    author: { type: String },
    referenceLinks: [{ type: String }],

    likes: [{ type: String }],
    dislikes: [{ type: String }],

    reports: [
      {
        user: { type: String },
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    customFields: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

mcqQuestionSchema.index({ chapterId: 1, paperId: 1 });
mcqQuestionSchema.index({ tags: 1, difficulty: 1, accessLevel: 1 });

const MCQQuestion = mongoose.model("MCQQuestion", mcqQuestionSchema);
export default MCQQuestion;
