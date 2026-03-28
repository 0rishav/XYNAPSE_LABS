import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import CourseIntro from "../models/courseIntroModal.js";
// import {cloudinary,deleteLocalFiles} from "../utils/cloudinaryConfig.js";

export const createCourseIntro = CatchAsyncError(async (req, res, next) => {
  const {
    bannerText,
    title,
    subtitle,
    tagline,
    description,
    features,
    rightImage,
    isActive = true,
  } = req.body;
  console.log("Request Body:", req.body);

  // const existing = await Intro.findOne();
  // if (existing) {
  //   return next(new ErrorHandler("Course intro already exists", 400));
  // }

  const formattedFeatures = features.map((f) => ({
    icon: f.icon.trim(),
    text: f.text.trim(),
  }));
  const courseIntro = await CourseIntro.create({
    bannerText: bannerText.trim(),
    title,
    subtitle: subtitle.trim(),
    tagline: tagline.trim(),
    description: description.trim(),
    features: formattedFeatures,
    rightImage,
    isActive,
  });
  try {
    await redis.del("courseIntro:latest", "courseIntro:active");
  } catch (error) {
    console.error("Redis error:", error.message);
  }

  res.status(201).json({
    success: true,
    message: "Course intro created successfully",
    data: courseIntro,
  });
});

export const getCourseIntro = CatchAsyncError(async (req, res, next) => {
  const cacheKey = "courseIntro:latest";

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);

      return res.status(200).json({
        success: true,
        message: "Course intro fetched from cache",
        data,
      });
    }
  } catch (error) {
    console.error(" Redis error:", error.message);
  }

  const courseIntro = await CourseIntro.find();

  if (!courseIntro) {
    return next(new ErrorHandler("No course intro found", 404));
  }

  try {
    await redis.set(cacheKey, courseIntro, { ex: 3600 });
  } catch (error) {
    console.error(" Redis error:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "Course intro fetched successfully",
    data: courseIntro,
  });
});

export const getActiveCourseIntro = CatchAsyncError(async (req, res, next) => {
  const cacheKey = "courseIntro:active";

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return res.status(200).json({
        success: true,
        message: "Active course intro fetched from cache",
        data,
      });
    }
  } catch (error) {
    console.error("Redis error:", error.message);
  }

  const courseIntro = await CourseIntro.findOne({ isActive: true });

  if (!courseIntro) {
    return next(new ErrorHandler("No active course intro found", 404));
  }

  try {
    await redis.set(cacheKey, courseIntro, { ex: 3600 });
  } catch (error) {
    console.error("Redis error:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "Active course intro fetched successfully",
    data: courseIntro,
  });
});

export const updateCourseIntro = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { features, ...rest } = req.body;
  const courseIntro = await CourseIntro.findById(id);
  if (!courseIntro) {
    return next(new ErrorHandler("Course intro not found", 404));
  }

  const allowedUpdates = [
    "bannerText",
    "title",
    "subtitle",
    "tagline",
    "description",
    "features",
    "rightImage",
    "isActive",
  ];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      courseIntro[field] =
        typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
    }
  });
  courseIntro.features = features.map((f) => ({
    icon: f.icon.trim(),
    text: f.text.trim(),
  }));

  await courseIntro.save();

  try {
    await redis.del("courseIntro:latest");
  } catch (error) {
    console.error("Redis error:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "Course intro updated successfully",
    data: courseIntro,
  });
});

export const deleteCourseIntro = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const courseIntro = await CourseIntro.findByIdAndDelete(id);

  if (!courseIntro) {
    return next(new ErrorHandler("Course intro not found", 404));
  }

  try {
    await redis.del("courseIntro:latest");
  } catch (error) {
    console.error("Redis error:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "Course intro deleted successfully",
  });
});
