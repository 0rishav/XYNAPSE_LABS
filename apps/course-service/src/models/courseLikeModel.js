import mongoose from "mongoose";

const courseLikeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

courseLikeSchema.index({ courseId: 1, userId: 1 }, { unique: true });

courseLikeSchema.index({ userId: 1 });

const CourseLike = mongoose.model("CourseLike", courseLikeSchema);
export default CourseLike