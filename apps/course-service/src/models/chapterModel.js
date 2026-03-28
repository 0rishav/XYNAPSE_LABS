import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    order: {
      type: Number,
      required: true,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    estimatedDurationMinutes: {
      type: Number,
      default: 0,
    },

    totalMcqs: {
      type: Number,
      default: 0,
    },

    totalProblems: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

chapterSchema.index({ courseId: 1, order: 1 }, { unique: true });

chapterSchema.index({ courseId: 1, slug: 1 }, { unique: true });

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
