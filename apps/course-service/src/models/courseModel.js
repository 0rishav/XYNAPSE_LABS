import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    parentCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    type: {
      type: String,
      enum: ["theory", "practical"],
      required: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    badges: {
      type: [String],
      enum: ["hot", "popular", "trending", "new"],
      default: [],
    },

    tags: [{ type: String, lowercase: true }],

    shortDescription: { type: String, maxlength: 500 },
    thumbnail: String,

    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, select: false },
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
  { timestamps: true, versionKey: false },
);

courseSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

courseSchema.index({
  categoryId: 1,
  isPublished: 1,
  createdAt: -1,
});

courseSchema.index({
  type: 1,
  isPublished: 1,
});

courseSchema.index({ parentCourse: 1 });

courseSchema.index({ badges: 1 });
courseSchema.index({ tags: 1 });

const Course = mongoose.model("Course", courseSchema);
export default Course;
