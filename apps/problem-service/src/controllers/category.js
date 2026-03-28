import mongoose from "mongoose";
import Category from "../models/categoryModal.js";
// import { redis } from "../utils/redisClient.js";

import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import {
  deleteLocalFiles,
  uploadOnCloudinary,
} from "../../../../packages/common/src/infra/uploadOnCloudinary.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";

export const createCategory = CatchAsyncError(async (req, res, next) => {
  const file = req.file;
  let iconData = {};

  try {
    // Sanitize incoming data
    const sanitized = sanitizeObject(req.body, {
      contextType: "string",
      lab: "string?",
      labSection: "string?",
      parentCategory: "string?",
      name: "string",
      description: "string?",
      metaTitle: "string?",
      metaDescription: "string?",
      order: "number?",
    });

    const {
      contextType,
      lab,
      labSection,
      parentCategory,
      name,
      description,
      metaTitle,
      metaDescription,
      order,
    } = sanitized;

    // Validate contextType
    if (!contextType || !["lab", "course"].includes(contextType)) {
      return next(new ErrorHandler("Invalid or missing contextType", 400));
    }

    const filter = { name: name.trim(), contextType };

    // Lab-specific validation
    if (contextType === "lab") {
      if (!lab || !labSection) {
        return next(
          new ErrorHandler(
            "lab and labSection are required for lab context",
            400,
          ),
        );
      }
      if (
        !mongoose.Types.ObjectId.isValid(lab) ||
        !mongoose.Types.ObjectId.isValid(labSection)
      ) {
        return next(new ErrorHandler("Invalid lab or labSection ID", 400));
      }
      filter.lab = lab;
      filter.labSection = labSection;
    }

    let validParentCategory = null;
    if (parentCategory && mongoose.Types.ObjectId.isValid(parentCategory)) {
      validParentCategory = parentCategory;
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    const existing = await Category.findOne({ ...filter, slug });
    if (existing) {
      return next(
        new ErrorHandler("Category with same name already exists", 409),
      );
    }

    if (file) {
      const result = await uploadOnCloudinary(file.path);
      if (!result?.secure_url) {
        return next(new ErrorHandler("Icon upload failed", 500));
      }
      iconData = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    }

    let ancestors = [];
    if (validParentCategory) {
      const parent = await Category.findById(validParentCategory).select(
        "ancestors name slug",
      );
      if (!parent) {
        return next(new ErrorHandler("Parent category not found", 404));
      }
      ancestors = [
        ...parent.ancestors,
        { _id: parent._id, name: parent.name, slug: parent.slug },
      ];
    }

    // Build category data
    const categoryData = {
      contextType,
      parentCategory: validParentCategory,
      name,
      slug,
      description,
      icon: iconData,
      order: order || 0,
      ancestors,
      metaTitle,
      metaDescription,
      createdBy: req.user._id,
    };

    if (contextType === "lab") {
      categoryData.lab = lab;
      categoryData.labSection = labSection;
    }

    // Create category
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    console.error("Category creation error:", err);
    return next(new ErrorHandler(err.message || "Internal Server Error", 500));
  } finally {
    if (file?.path) deleteLocalFiles(file.path);
  }
});

export const updateCategory = CatchAsyncError(async (req, res, next) => {
  const categoryId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return next(new ErrorHandler("Invalid category ID", 400));
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new ErrorHandler("Category not found", 404));
  }

  const file = req.file;
  let iconData = category.icon;

  try {
    const sanitized = sanitizeObject(req.body, {
      contextType: "string?",
      lab: "string?",
      labSection: "string?",
      courseId: "string?",
      name: "string?",
      description: "string?",
      order: "number?",
      isActive: "boolean?",
      parentCategory: "string?",
      metaTitle: "string?",
      metaDescription: "string?",
    });

    const {
      contextType,
      lab,
      labSection,
      courseId,
      name,
      description,
      order,
      isActive,
      parentCategory,
      metaTitle,
      metaDescription,
    } = sanitized;

    if (contextType && !["lab", "course"].includes(contextType)) {
      return next(new ErrorHandler("Invalid contextType", 400));
    }

    if (
      contextType === "lab" ||
      (!contextType && category.contextType === "lab")
    ) {
      const labValue = lab || category.lab;
      const labSectionValue = labSection || category.labSection;
      if (!labValue || !labSectionValue) {
        return next(
          new ErrorHandler(
            "lab and labSection are required for lab context",
            400,
          ),
        );
      }
      if (
        !mongoose.Types.ObjectId.isValid(labValue) ||
        !mongoose.Types.ObjectId.isValid(labSectionValue)
      ) {
        return next(new ErrorHandler("Invalid lab or labSection ID", 400));
      }
      category.lab = labValue;
      category.labSection = labSectionValue;
    }

    if (
      contextType === "course" ||
      (!contextType && category.contextType === "course")
    ) {
      const courseValue = courseId || category.course;
      if (!courseValue) {
        return next(
          new ErrorHandler("courseId is required for course context", 400),
        );
      }
      if (!mongoose.Types.ObjectId.isValid(courseValue)) {
        return next(new ErrorHandler("Invalid courseId", 400));
      }
      category.course = courseValue;
    }

    if (file) {
      const result = await uploadOnCloudinary(file.path);
      if (!result?.secure_url) {
        return next(new ErrorHandler("Icon upload failed", 500));
      }
      if (iconData?.public_id) {
        await cloudinary.uploader.destroy(iconData.public_id);
      }
      iconData = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const newSlug = name.toLowerCase().trim().replace(/\s+/g, "-");
      const filter = { slug: newSlug, _id: { $ne: categoryId } };
      if (category.contextType === "lab") {
        filter.lab = category.lab;
        filter.labSection = category.labSection;
      } else if (category.contextType === "course") {
        filter.course = category.course;
      }
      const existing = await Category.findOne(filter);
      if (existing) {
        return next(
          new ErrorHandler(
            "Another category with this name already exists",
            409,
          ),
        );
      }
      category.slug = newSlug;
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      category.metaDescription = metaDescription;
    category.icon = iconData;

    if (parentCategory && parentCategory !== String(category.parentCategory)) {
      const parent = await Category.findById(parentCategory).select(
        "ancestors name slug",
      );
      if (!parent) {
        return next(new ErrorHandler("Parent category not found", 404));
      }
      category.parentCategory = parent._id;
      category.ancestors = [
        ...parent.ancestors,
        { _id: parent._id, name: parent.name, slug: parent.slug },
      ];
    }

    category.updatedBy = req.user._id;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } finally {
    if (file?.path) deleteLocalFiles(file.path);
  }
});

export const getAllCategories = CatchAsyncError(async (req, res, next) => {
  const { contextType, labId, labSectionId } = req.query;

  if (!contextType || !["lab", "course"].includes(contextType)) {
    return next(new ErrorHandler("Invalid or missing contextType", 400));
  }

  const filter = {
    contextType,
    isActive: true,
    isDeleted: false,
  };

  if (contextType === "lab") {
    if (!labId || !labSectionId) {
      return next(new ErrorHandler("labId and labSectionId are required", 400));
    }
    if (
      !mongoose.Types.ObjectId.isValid(labId) ||
      !mongoose.Types.ObjectId.isValid(labSectionId)
    ) {
      return next(new ErrorHandler("Invalid labId or labSectionId", 400));
    }
    filter.lab = labId;
    filter.labSection = labSectionId;
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 9;
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .select(
        "name slug description contextType icon order parentCategory ancestors metaTitle metaDescription createdAt",
      )
      .lean(),
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: `Categories fetched for ${contextType} context`,
    total,
    page,
    totalPages,
    categories,
  });
});

// export const getAllCategories = CatchAsyncError(async (req, res, next) => {
//   const { labId, labSectionId } = req.query;

//   if (!labId || !labSectionId) {
//     return next(new ErrorHandler("labId and labSectionId are required", 400));
//   }

//   if (
//     !mongoose.Types.ObjectId.isValid(labId) ||
//     !mongoose.Types.ObjectId.isValid(labSectionId)
//   ) {
//     return next(new ErrorHandler("Invalid labId or labSectionId", 400));
//   }

//   const page = parseInt(req.query.page) || 1;
//   const limit = 9;
//   const skip = (page - 1) * limit;

//   // const cacheKey = `categories:${labId}:${labSectionId}:page:${page}`;

//   // 🔴 Redis cache fetch disabled
//   // const cached = await redis.get(cacheKey);
//   // if (cached) {
//   //   return res.status(200).json({
//   //     success: true,
//   //     message: "Categories fetched from cache",
//   //     cached,
//   //   });
//   // }

//   const [categories, total] = await Promise.all([
//     Category.find({
//       lab: labId,
//       labSection: labSectionId,
//       isActive: true,
//       isDeleted: false,
//     })
//       .sort({ order: 1, name: 1 })
//       .skip(skip)
//       .limit(limit)
//       .select(
//         "name slug description icon order parentCategory ancestors metaTitle metaDescription createdAt"
//       )
//       .lean(),

//     Category.countDocuments({
//       lab: labId,
//       labSection: labSectionId,
//       isActive: true,
//       isDeleted: false,
//     }),
//   ]);

//   const totalPages = Math.ceil(total / limit);

//   const responseData = {
//     categories,
//     total,
//     page,
//     totalPages,
//   };

//   // 🔴 Redis cache store disabled
//   // await redis.set(cacheKey, responseData, { ex: 3600 });

//   res.status(200).json({
//     success: true,
//     message: "Categories fetched from DB",
//     ...responseData,
//   });
// });

export const getCategoryById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid category ID", 400));
  }

  const category = await Category.findById(id)
    .select("-__v")
    .populate("parentCategory", "name slug")
    .lean();

  if (!category || category.isDeleted) {
    return next(new ErrorHandler("Category not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category,
  });
});

export const deleteCategory = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid category ID", 400));
  }

  const category = await Category.findById(id);
  if (!category || category.isDeleted) {
    return next(new ErrorHandler("Category not found", 404));
  }

  if (category.icon?.public_id) {
    try {
      await cloudinary.v2.uploader.destroy(category.icon.public_id);
    } catch (err) {
      console.error("Cloudinary deletion failed:", err.message);
    }
  }

  category.isDeleted = true;
  category.isActive = false;
  category.updatedBy = req.user._id;
  await category.save();

  // const keys = await redis.keys(
  //   `categories:${category.lab}:${category.labSection}:page:*`
  // );
  // if (keys.length) await redis.del(keys);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
