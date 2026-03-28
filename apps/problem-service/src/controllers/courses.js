import mongoose from "mongoose";
import Course from "../models/courseModal.js";
// import { sanitizeObject, sanitizeString } from "../utils/sanitizeInput.js";
import fs from "fs";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { sanitizeObject, sanitizeString } from "../../../../packages/common/src/utils/sanitizeInput.js";

export const createCourse = CatchAsyncError(async (req, res, next) => {
  console.log("🔹 req.body:", req.body);
  console.log("🔹 req.files:", req.files);

  const bannerPath = req.files?.banner?.[0]?.path || null;
  const iconPath = req.files?.icon?.[0]?.path || null;

  let bannerUpload = null;
  let iconUpload = null;
  let course = null;

  try {
    // Normalize req.body to plain object
    const normalizedBody = Object.assign({}, req.body);

    // Schema for sanitization
    const courseSchema = {
      name: "string",
      categoryId: "string",
      title: "string",
      description: "string",
      heroHeading: "string",
      heroSubtitle: "string",
      ctaText: "string",
      ctaLink: "string",
      highlightText: "string",
      learningPoints: "string",
      labels: "string",
      metaTitle: "string",
      metaDescription: "string",
    };

    // Sanitize data
    const sanitizedData = sanitizeObject(normalizedBody, courseSchema);
    console.log("🔹 sanitizedData:", sanitizedData);

    // Validate required fields
    if (!sanitizedData.name || !sanitizedData.categoryId) {
      console.error("❌ Missing required fields");
      throw new ErrorHandler("Course name and category are required", 400);
    }

    sanitizedData.createdBy = req.user?._id;

    // Convert learningPoints and labels to arrays
    const normalizeArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field.map((v) => sanitizeString(v));
      return field.split(",").map((v) => sanitizeString(v.trim())).filter(Boolean);
    };

    sanitizedData.learningPoints = normalizeArrayField(normalizedBody.learningPoints);
    sanitizedData.labels = normalizeArrayField(normalizedBody.labels);

    // Create course in DB without images
    course = await Course.create(sanitizedData);
    console.log("✅ Course created in DB:", course._id);

    // Upload banner if exists
    if (bannerPath) {
      try {
        bannerUpload = await cloudinary.uploader.upload(bannerPath, {
          folder: "courses/banners",
        });
        course.banner = {
          public_id: bannerUpload.public_id,
          secure_url: bannerUpload.secure_url,
        };
        console.log("✅ Banner uploaded:", bannerUpload.secure_url);
      } catch (err) {
        throw new ErrorHandler("Failed to upload banner to Cloudinary", 500);
      }
    }

    // Upload icon if exists
    if (iconPath) {
      try {
        iconUpload = await cloudinary.uploader.upload(iconPath, {
          folder: "courses/icons",
        });
        course.icon = {
          public_id: iconUpload.public_id,
          secure_url: iconUpload.secure_url,
        };
        console.log("✅ Icon uploaded:", iconUpload.secure_url);
      } catch (err) {
        throw new ErrorHandler("Failed to upload icon to Cloudinary", 500);
      }
    }

    // Save course with images
    await course.save();
    console.log("✅ Course saved with images:", course._id);

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("❌ Error creating course:", error.message);

    // Rollback Cloudinary uploads
    if (bannerUpload?.public_id) {
      try {
        await cloudinary.uploader.destroy(bannerUpload.public_id);
      } catch {
        console.warn("⚠️ Failed to rollback banner on Cloudinary");
      }
    }

    if (iconUpload?.public_id) {
      try {
        await cloudinary.uploader.destroy(iconUpload.public_id);
      } catch {
        console.warn("⚠️ Failed to rollback icon on Cloudinary");
      }
    }

    // Rollback DB
    if (course?._id) {
      try {
        await Course.findByIdAndDelete(course._id);
      } catch {
        console.warn("⚠️ Failed to rollback course in DB");
      }
    }

    return next(
      new ErrorHandler(
        error.message || "Something went wrong while creating course",
        error.statusCode || 500
      )
    );
  } finally {
    // Cleanup local files
    [bannerPath, iconPath].forEach((filePath) => {
      try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.warn("⚠️ Failed to delete local file:", cleanupErr.message);
      }
    });
  }
});



export const getAllCourses = CatchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filters = sanitizeObject(req.query);
  delete filters.page;
  delete filters.limit;
  delete filters.sort;

  filters.isDeleted = false;

  const sortOption = req.query.sort || "-createdAt";

  const courses = await Course.find(filters)
    .populate("categoryId", "name")
    .populate("createdBy", "name email")
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Course.countDocuments(filters);

  res.status(200).json({
    success: true,
    count: courses.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: courses,
  });
});

export const getCoursesByCategory = CatchAsyncError(async (req, res, next) => {
  const { categoryId } = req.params;

  if (!mongoose.isValidObjectId(categoryId)) {
    return next(new ErrorHandler("Invalid category ID", 400));
  }

  const courses = await Course.find({
    categoryId,
    isDeleted: false,
    isActive: true,
  })
    .populate("categoryId", "name")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  if (!courses.length)
    return next(new ErrorHandler("No courses found for this category", 404));

  const formattedCourses = courses.map((course) => ({
    _id: course._id,
    name: course.name,
    title: course.title,
    description: course.description,
    banner: course.banner,
    heroHeading: course.heroHeading,
    heroSubtitle: course.heroSubtitle,
    ctaText: course.ctaText,
    ctaLink: course.ctaLink,
    highlightText: course.highlightText,
    icon: course.icon,
    labels: course.labels,
    learningPoints: course.learningPoints,
    metaTitle: course.metaTitle,
    metaDescription: course.metaDescription,
    category: course.categoryId,
    createdBy: course.createdBy,
    views: course.views,
    likes: course.likes,
    bookmarks: course.bookmarks,
    slug: course.slug,
    availability: course.availability,
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }));

  res.status(200).json({
    success: true,
    count: formattedCourses.length,
    data: formattedCourses,
  });
});

export const updateCourse = CatchAsyncError(async (req, res, next) => {
  const bannerPath = req.files?.banner?.[0]?.path || null;
  const iconPath = req.files?.icon?.[0]?.path || null;

  let newBannerUpload = null;
  let newIconUpload = null;
  let oldBanner = null;
  let oldIcon = null;

  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!course) return next(new ErrorHandler("Course not found", 404));

    oldBanner = course.banner?.public_id || null;
    oldIcon = course.icon?.public_id || null;

    const sanitizedData = sanitizeObject(req.body);
    sanitizedData.updatedBy = req.user?._id;

    Object.assign(course, sanitizedData);

    if (bannerPath) {
      newBannerUpload = await cloudinary.uploader.upload(bannerPath, {
        folder: "courses/banners",
      });
      course.banner = {
        public_id: newBannerUpload.public_id,
        secure_url: newBannerUpload.secure_url,
      };
    }

    if (iconPath) {
      newIconUpload = await cloudinary.uploader.upload(iconPath, {
        folder: "courses/icons",
      });
      course.icon = {
        public_id: newIconUpload.public_id,
        secure_url: newIconUpload.secure_url,
      };
    }

    await course.save();
    if (bannerPath && oldBanner) {
      await cloudinary.uploader.destroy(oldBanner).catch(() => {});
    }
    if (iconPath && oldIcon) {
      await cloudinary.uploader.destroy(oldIcon).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error(error.message);

    if (newBannerUpload?.public_id) {
      await cloudinary.uploader
        .destroy(newBannerUpload.public_id)
        .catch(() => {});
    }
    if (newIconUpload?.public_id) {
      await cloudinary.uploader
        .destroy(newIconUpload.public_id)
        .catch(() => {});
    }

    return next(
      new ErrorHandler(
        error.message || "Something went wrong while updating course",
        500
      )
    );
  } finally {
    [bannerPath, iconPath].forEach((filePath) => {
      try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.warn(cleanupErr.message);
      }
    });
  }
});

export const deleteCourse = CatchAsyncError(async (req, res, next) => {
  const course = await Course.findOne({ _id: req.params.id, isDeleted: false });

  if (!course) return next(new ErrorHandler("Course not found", 404));

  try {
    const deletions = [];

    if (course.banner?.public_id) {
      deletions.push(
        cloudinary.uploader.destroy(course.banner.public_id).catch((err) => {
          console.warn(err.message);
        })
      );
    }

    if (course.icon?.public_id) {
      deletions.push(
        cloudinary.uploader.destroy(course.icon.public_id).catch((err) => {
          console.warn(err.message);
        })
      );
    }

    await Promise.all(deletions);

    await course.softDelete();

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    return next(
      new ErrorHandler(
        error.message || "Something went wrong while deleting course",
        500
      )
    );
  }
});
