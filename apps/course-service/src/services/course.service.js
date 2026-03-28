import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Category from "../models/categoryModel.js";
import Course from "../models/courseModel.js";
import slugify from "slugify";

export const createCourseService = async (payload, file, session, context) => {
  const { title, categoryId, createdBy } = payload;
  const { requestId } = context;

  const category = await Category.findOne({
    _id: categoryId,
    isDeleted: false,
  }).session(session);
  if (!category) {
    throw new ErrorHandler(
      "Category not found",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const slug = slugify(title, { lower: true, strict: true });
  const existingCourse = await Course.findOne({
    slug,
    isDeleted: false,
  }).session(session);
  if (existingCourse) {
    throw new ErrorHandler(
      "Course with this title already exists",
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
    );
  }

  let thumbnailUrl = "";
  if (file) {
    try {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "xynapse_courses/thumbnails",
        resource_type: "image",
      });
      thumbnailUrl = uploadRes.secure_url;
    } catch (error) {
      logger.error(
        `[CloudinaryUploadError] RID: ${requestId} - ${error.message}`,
      );
      throw new ErrorHandler(
        "Image upload to Cloudinary failed",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  const newCourse = await Course.create(
    [
      {
        ...payload,
        slug,
        thumbnail: thumbnailUrl,
        createdBy,
        isPublished: false,
      },
    ],
    { session },
  );

  logger.info(
    `[CourseCreated] RID: ${requestId} - ID: ${newCourse[0]._id} - Title: ${title}`,
  );
  return newCourse[0];
};

export const updateCourseService = async (
  id,
  payload,
  file,
  session,
  context,
) => {
  const { requestId } = context;

  const course = await Course.findOne({ _id: id, isDeleted: false }).session(
    session,
  );
  if (!course) {
    throw new ErrorHandler(
      "Course not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (payload.categoryId) {
    const category = await Category.findOne({
      _id: payload.categoryId,
      isDeleted: false,
    }).session(session);
    if (!category) {
      throw new ErrorHandler(
        "Invalid Category ID",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.NOT_FOUND,
      );
    }
  }

  if (payload.title) {
    payload.slug = slugify(payload.title, { lower: true, strict: true });
    const duplicate = await Course.findOne({
      slug: payload.slug,
      _id: { $ne: id },
      isDeleted: false,
    }).session(session);
    if (duplicate) {
      throw new ErrorHandler(
        "Course with this title already exists",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.CONFLICT,
      );
    }
  }

  if (file) {
    try {
      if (course.thumbnail) {
        const publicId = course.thumbnail.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(
          `xynapse_courses/thumbnails/${publicId}`,
        );
      }

      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "xynapse_courses/thumbnails",
      });
      payload.thumbnail = uploadRes.secure_url;
    } catch (error) {
      logger.error(
        `[CloudinaryUpdateError] RID: ${requestId} - ${error.message}`,
      );
      throw new ErrorHandler(
        "Image update on Cloudinary failed",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, session },
  );

  logger.info(`[CourseUpdated] RID: ${requestId} - ID: ${id}`);
  return updatedCourse;
};

export const getAllCoursesService = async (pagination, filters, context) => {
  const { page, limit, skip } = pagination;
  const { requestId } = context;

  const baseFilter = { isPublished: true, isDeleted: false, ...filters };

  const [courses, totalCount] = await Promise.all([
    Course.find(baseFilter)
      .populate("categoryId", "name slug") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(baseFilter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  logger.info(`[AllCoursesFetched] RID: ${requestId} - Count: ${courses.length}`);

  return {
    courses,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

export const searchCoursesService = async (query, pagination) => {
  const { limit, skip } = pagination;
  
  const searchFilter = {
    isPublished: true,
    isDeleted: false,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } }
    ]
  };

  const courses = await Course.find(searchFilter)
    .populate("categoryId", "name")
    .skip(skip)
    .limit(limit)
    .lean();

  return courses;
};

export const getSingleCourseService = async (slug, context) => {
  const course = await Course.findOne({ slug, isPublished: true, isDeleted: false })
    .populate("categoryId", "name slug icon")
    .populate("parentCourse", "title slug")
    .lean();

  if (!course) {
    throw new ErrorHandler("Course not found", 404, "NOT_FOUND");
  }

  logger.info(`[SingleCourseFetched] RID: ${context.requestId} - Slug: ${slug}`);
  return course;
};

export const getRecommendationsService = async (courseId) => {
  const currentCourse = await Course.findById(courseId).lean();
  if (!currentCourse) throw new ErrorHandler("Course not found", 404, "NOT_FOUND");

  return await Course.find({
    _id: { $ne: courseId }, 
    isPublished: true,
    isDeleted: false,
    $or: [
      { categoryId: currentCourse.categoryId },
      { tags: { $in: currentCourse.tags } }
    ]
  })
  .limit(5)
  .select("title slug thumbnail type level")
  .lean();
};

export const toggleCourseStatusService = async (id, status, userId, session) => {
  const course = await Course.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isPublished: status, updatedBy: userId },
    { new: true, session }
  ).lean();

  if (!course) throw new ErrorHandler("Course not found", 404, "NOT_FOUND");
  return course;
};

export const moveCourseCategoryService = async (courseId, newCategoryId, userId, session, context) => {
  const { requestId } = context;

  const categoryExists = await Category.findOne({ _id: newCategoryId, isDeleted: false }).session(session);
  if (!categoryExists) {
    throw new ErrorHandler("Target Category not found", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.NOT_FOUND);
  }

  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, isDeleted: false },
    { 
      $set: { 
        categoryId: newCategoryId,
        updatedBy: userId 
      } 
    },
    { new: true, session }
  ).populate("categoryId", "name slug");

  if (!updatedCourse) {
    throw new ErrorHandler("Course not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  logger.info(`[CourseMoved] RID: ${requestId} - Course: ${courseId} moved to Category: ${newCategoryId}`);
  
  return updatedCourse;
};

export const softDeleteCourseService = async (id, userId, session) => {
  const course = await Course.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, updatedBy: userId },
    { new: true, session }
  );

  if (!course) {
    throw new ErrorHandler("Course not found", 404, "NOT_FOUND");
  }
  return course;
};

export const hardDeleteCourseService = async (id, session, context) => {
  const { requestId } = context;

  const course = await Course.findById(id).session(session);
  if (!course) {
    throw new ErrorHandler("Course not found", 404, "NOT_FOUND");
  }

  if (course.thumbnail) {
    try {
      const publicId = course.thumbnail.split("/").pop().split(".")[0];
      const folderPath = "xynapse_courses/thumbnails/";
      
      await cloudinary.uploader.destroy(`${folderPath}${publicId}`);
      logger.info(`[CloudinaryCleanup] RID: ${requestId} - Deleted: ${publicId}`);
    } catch (error) {
      logger.error(`[CloudinaryCleanupError] RID: ${requestId} - ${error.message}`);
    }
  }

  await Course.findByIdAndDelete(id).session(session);
  
  logger.warn(`[HardDeleteSuccess] RID: ${requestId} - ID: ${id} deleted permanently`);
  return { id };
};

