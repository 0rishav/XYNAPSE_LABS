import mongoose from "mongoose";

const courseFAQSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true, versionKey: false },
);

courseFAQSchema.index({ courseId: 1, order: 1 });

const CourseFAQ = mongoose.model("CourseFAQ", courseFAQSchema);
export default CourseFAQ
