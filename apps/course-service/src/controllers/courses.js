import mongoose from "mongoose";
import fs from "fs";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createCourseService,
  getAllCoursesService,
  getCourseByIdService,
  getRecommendationsService,
  getSingleCourseService,
  hardDeleteCourseService,
  moveCourseCategoryService,
  searchCoursesService,
  softDeleteCourseService,
  toggleCourseStatusService,
  updateCourseService,
  verifyCourseService,
} from "../services/course.service.js";
import { getPagination } from "../../../../packages/common/src/utils/paginationHelper.js";
import Course from "../models/courseModel.js";

export const createCourse = CatchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const context = { requestId: req.requestId };

  try {
    let { tags, badges, ...restOfBody } = req.body;

    console.log(req.body);

    if (tags) {
      tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    if (badges) {
      badges = Array.isArray(badges)
        ? badges
        : badges
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean);
    }

    const payload = {
      ...restOfBody,
      tags: tags || [],
      badges: badges || [],
      createdBy: req.user._id,
    };

    const course = await createCourseService(
      payload,
      req.file,
      session,
      context,
    );

    await session.commitTransaction();

    sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Course initialized successfully (Draft Mode)",
      course,
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[CourseCreationError] RID: ${req.requestId} - ${error.message}`,
    );
    next(error);
  } finally {
    session.endSession();

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err)
          logger.error(
            `[FileCleanupError] RID: ${req.requestId} - ${err.message}`,
          );
        else
          logger.info(
            `[FileCleanupSuccess] RID: ${req.requestId} - Path: ${req.file.path}`,
          );
      });
    }
  }
});

export const updateCourse = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };

    let { tags, badges, ...restOfBody } = req.body;

    if (tags) {
      tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    if (badges) {
      badges = Array.isArray(badges)
        ? badges
        : badges
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean);
    }

    const payload = {
      ...restOfBody,
      ...(tags && { tags }),
      ...(badges && { badges }),
      updatedBy: req.user.id,
    };

    const course = await updateCourseService(
      id,
      payload,
      req.file,
      session,
      context,
    );

    await session.commitTransaction();
    sendResponse(res, HTTP_STATUS.OK, "Course updated successfully", course);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export const getAllCourses = CatchAsyncError(async (req, res, next) => {
  const { type, categoryId } = req.query;
  const pagination = getPagination(req.query);
  const context = { requestId: req.requestId };

  const filters = { isPublished: true, isDeleted: false };

  if (type) {
    filters.type = type;
  }

  if (categoryId) {
    filters.categoryId = categoryId;
  }

  const result = await getAllCoursesService(pagination, filters, context);

  sendResponse(
    res,
    HTTP_STATUS.OK,
    `Fetched ${type || "all"} courses successfully`,
    result,
  );
});

export const searchCourses = CatchAsyncError(async (req, res, next) => {
  const { q } = req.query;
  const pagination = getPagination(req.query);

  const courses = await searchCoursesService(q, pagination);
  sendResponse(res, 200, "Search results fetched", courses);
});

export const getCoursesByCategory = CatchAsyncError(async (req, res, next) => {
  const { categoryId } = req.params;
  const pagination = getPagination(req.query);
  const context = { requestId: req.requestId };

  const result = await getAllCoursesService(
    pagination,
    { categoryId },
    context,
  );
  sendResponse(
    res,
    HTTP_STATUS.OK,
    "Category courses fetched successfully",
    result,
  );
});

export const getCourseBySlug = CatchAsyncError(async (req, res, next) => {
  const { slug } = req.params;
  const context = { requestId: req.requestId };

  const course = await getSingleCourseService(slug, context);
  sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course detail fetched successfully",
    course,
  );
});

export const getRecommendations = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const recommendations = await getRecommendationsService(id);
  sendResponse(res, 200, "Recommended courses fetched", recommendations);
});

export const toggleCourseStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { isPublished } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const course = await toggleCourseStatusService(
      id,
      isPublished,
      req.user.id,
      session,
    );
    await session.commitTransaction();
    sendResponse(
      res,
      200,
      `Course ${isPublished ? "Published" : "Unpublished"}`,
      course,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const moveCourseCategory = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { categoryId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };
    const result = await moveCourseCategoryService(
      id,
      categoryId,
      req.user.id,
      session,
      context,
    );

    await session.commitTransaction();
    sendResponse(
      res,
      HTTP_STATUS.OK,
      "Course category moved successfully",
      result,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const softDeleteCourse = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const course = await softDeleteCourseService(id, req.user.id, session);
    await session.commitTransaction();
    sendResponse(res, 200, "Course moved to trash (Soft Delete)");
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const hardDeleteCourse = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };
    await hardDeleteCourseService(id, session, context);

    await session.commitTransaction();
    sendResponse(res, 200, "Course and associated assets deleted permanently");
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const verifyCourse = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;

  if (!courseId) {
    return next(
      new ErrorHandler("Course ID is missing", HTTP_STATUS.BAD_REQUEST),
    );
  }

  const exists = await verifyCourseService(courseId);

  return sendResponse(res, HTTP_STATUS.OK, "Course verification successful", {
    exists,
  });
});

export const getCourseVerification = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;

  if (!courseId) {
    return next(
      new ErrorHandler("Course ID required", HTTP_STATUS.BAD_REQUEST),
    );
  }

  const course = await getCourseByIdService(courseId);

  if (!course) {
    return next(new ErrorHandler("Course not found", HTTP_STATUS.NOT_FOUND));
  }

  return sendResponse(res, HTTP_STATUS.OK, "Course data fetched", course);
});
