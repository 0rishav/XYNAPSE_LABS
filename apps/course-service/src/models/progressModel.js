import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: function () {
        return this.type === "chapter";
      },
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: function () {
        return this.type === "content";
      },
      index: true,
    },

    type: { type: String, enum: ["chapter", "content"], required: true },
    status: { type: String, enum: ["read", "in_progress"], default: "read" },
    readAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

userProgressSchema.index(
  { userId: 1, type: 1, chapterId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "chapter",
      chapterId: { $exists: true, $ne: null },
    },
  },
);

userProgressSchema.index(
  { userId: 1, type: 1, contentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "content",
      contentId: { $exists: true, $ne: null },
    },
  },
);

const UserProgress = mongoose.model("UserProgress", userProgressSchema);
export default UserProgress;
