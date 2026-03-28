import mongoose from "mongoose";

const reviewReplySchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    replyText: {
      type: String,
      required: true,
      trim: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true, versionKey: false },
);

reviewReplySchema.index({ reviewId: 1, likesCount: -1, createdAt: -1 });

const ReviewReply = mongoose.model("ReviewReply", reviewReplySchema);
export default ReviewReply