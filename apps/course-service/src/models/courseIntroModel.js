import mongoose from "mongoose";

const introBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "heading",
        "paragraph",
        "bullet_list",
        "numbered_list",
        "code",
        "image",
        "video",
        "quote",
        "divider",
      ],
      required: true,
    },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const courseIntroSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, trim: true, default: "Course Introduction" },
    blocks: [introBlockSchema],
    isPublished: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true, versionKey: false },
);

const CourseIntro = mongoose.model("CourseIntro", courseIntroSchema);
export default CourseIntro;
