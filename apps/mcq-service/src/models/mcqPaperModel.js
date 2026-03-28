import mongoose from "mongoose";

const mcqPaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    courseId: { type: mongoose.Schema.Types.ObjectId, required: false },

    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MCQQuestion" }],

    durationMinutes: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 1 },

    type: {
      type: String,
      enum: ["practice", "contest"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    availability: {
      type: String,
      enum: ["active", "inactive", "disabled"],
      default: "active",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "public",
    },

    thumbnail: { url: String, public_id: String },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true },
);

mcqPaperSchema.index({ chapterId: 1, title: 1 });
mcqPaperSchema.index({ courseId: 1, type: 1, status: 1 });

const MCQPaper = mongoose.model("MCQPaper", mcqPaperSchema);
export default MCQPaper;
