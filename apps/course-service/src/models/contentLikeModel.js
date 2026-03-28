import mongoose from "mongoose";

const contentLikeSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

contentLikeSchema.index(
  { contentId: 1, userId: 1 },
  { unique: true }
);

contentLikeSchema.index({ contentId: 1 });

contentLikeSchema.index({ userId: 1 });

const ContentLike = mongoose.model("ContentLike", contentLikeSchema);
export default ContentLike