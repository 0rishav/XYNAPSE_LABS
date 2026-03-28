import mongoose from "mongoose";

const contentBlockSchema = new mongoose.Schema(
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
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: function () {
        return this.type !== "divider";
      },
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const seoSchema = new mongoose.Schema(
  {
    metaTitle: {
      type: String,
      maxlength: 60,
    },

    metaDescription: {
      type: String,
      maxlength: 160,
    },

    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    canonicalUrl: String,

    ogImage: String,

    noIndex: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const contentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    blocks: [contentBlockSchema],

    accessType: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },

    isPreviewFree: {
      type: Boolean,
      default: false,
    },

    seo: seoSchema,

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true, versionKey: false },
);

contentSchema.index(
  { slug: 1, chapterId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

contentSchema.index({
  title: "text",
  "seo.metaTitle": "text",
  "seo.metaDescription": "text",
  "seo.keywords": "text",
});

const Content = mongoose.model("Content", contentSchema);
export default Content;
