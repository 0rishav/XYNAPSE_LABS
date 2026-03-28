import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    reviewText: {
      type: String,
      default: "",
      trim: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

reviewSchema.index({ courseId: 1, likesCount: -1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review