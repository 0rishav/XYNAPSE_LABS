import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      maxlength: 500,
      default: "",
    },

    icon: {
      type: String,
      default: "",
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false, 
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

categorySchema.index({ slug: 1 }, { unique: true });

categorySchema.index({ isActive: 1, sortOrder: 1 });

categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Category = mongoose.model("Category", categorySchema);
export default Category