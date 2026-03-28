import mongoose from "mongoose";

const contentStatsSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      unique: true,
    },

    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: false },
);

contentStatsSchema.index({ contentId: 1 });

const ContentStats = mongoose.model("ContentStats", contentStatsSchema);
export default ContentStats;
