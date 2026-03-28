import mongoose from "mongoose";

const courseStatsSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
    },

    views: { type: Number, default: 0, min: 0 },

    likesCount: { type: Number, default: 0, min: 0 },

    sharesCount: { type: Number, default: 0, min: 0 },

    enrollmentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

courseStatsSchema.index({ courseId: 1 }, { unique: true });

const CourseStats = mongoose.model("CourseStats", courseStatsSchema);
export default CourseStats;
