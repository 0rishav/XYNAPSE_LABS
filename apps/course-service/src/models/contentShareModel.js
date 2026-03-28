import mongoose from "mongoose";

const contentShareSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    platform: {
      type: String,
      enum: [
        "whatsapp",
        "telegram",
        "twitter",
        "linkedin",
        "copy_link",
        "other",
      ],
      default: "copy_link",
    },
  },
  { timestamps: true },
);

contentShareSchema.index(
  { contentId: 1, userId: 1, platform: 1 },
  { unique: false },
);

const ContentShare = mongoose.model("ContentShare", contentShareSchema);
export default ContentShare;
