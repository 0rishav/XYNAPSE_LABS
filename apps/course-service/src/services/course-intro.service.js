import mongoose from "mongoose";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import CourseIntro from "../models/courseIntroModel.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";

export const createCourseIntroService = async (data, userId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courseId, title, blocks } = data;

    const existingIntro = await CourseIntro.findOne({
      courseId,
      isDeleted: false,
    }).session(session);

    if (existingIntro) {
      logger.warn(
        `[${requestId}] Service: Intro already exists for Course: ${courseId}`,
      );
      throw new ErrorHandler(
        "Course Introduction already exists for this course",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }

    let sanitizedBlocks = blocks;
    if (typeof blocks === "string") {
      sanitizedBlocks = JSON.parse(blocks);
    }

    const newIntro = await CourseIntro.create(
      [
        {
          courseId,
          title: title || "Course Introduction",
          blocks: sanitizedBlocks,
          createdBy: userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Course Intro created successfully ID: ${newIntro[0]._id}`,
    );

    return newIntro[0];
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      throw new ErrorHandler(
        "Duplicate course intro detected",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }

    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Intro Creation Error: ${error.message}`,
      );
      throw new ErrorHandler(
        error.message,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const getCourseIntroService = async (courseId, requestId) => {
  try {
    const intro = await CourseIntro.findOne({
      courseId,
      isDeleted: false,
    }).lean();

    if (!intro) {
      logger.error(
        `[${requestId}] Service: Course Intro not found for ID: ${courseId}`,
      );
      throw new ErrorHandler(
        "Course introduction not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (!intro.isPublished) {
      logger.warn(
        `[${requestId}] Service: Attempt to access unpublished intro for Course: ${courseId}`,
      );
    }

    return intro;
  } catch (error) {
    if (!(error instanceof ErrorHandler)) {
      logger.error(`[${requestId}] Service: Get Intro Error: ${error.message}`);
      throw new ErrorHandler(
        "Error fetching course introduction",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  }
};

export const updateCourseIntroService = async (
  courseId,
  updateData,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, blocks, isPublished } = updateData;

    const intro = await CourseIntro.findOne({
      courseId,
      isDeleted: false,
    }).session(session);

    if (!intro) {
      logger.error(
        `[${requestId}] Service: Intro not found for update. ID: ${courseId}`,
      );
      throw new ErrorHandler(
        "Course introduction not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const updatedIntro = await CourseIntro.findOneAndUpdate(
      { courseId, isDeleted: false },
      {
        $set: {
          ...(title && { title }),
          ...(blocks && { blocks }),
          ...(isPublished !== undefined && { isPublished }),
        },
      },
      {
        new: true,
        runValidators: true,
        session,
      },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Course Intro updated successfully for Course: ${courseId}`,
    );

    return updatedIntro;
  } catch (error) {
    await session.abortTransaction();

    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Update Intro Error: ${error.message}`,
      );
      throw new ErrorHandler(
        error.message || "Error updating course introduction",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateCourseIntroStatusService = async (
  courseId,
  isPublished,
  requestId,
) => {
  const intro = await CourseIntro.findOneAndUpdate(
    { courseId, isDeleted: false },
    { $set: { isPublished } },
    { new: true, runValidators: true },
  )
    .select("courseId isPublished")
    .lean();

  if (!intro)
    throw new ErrorHandler(
      "Course Intro not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );

  logger.info(
    `[${requestId}] Service: Status updated to ${isPublished} for Course: ${courseId}`,
  );
  return intro;
};

export const reorderCourseIntroBlocksService = async (
  courseId,
  blocks,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const intro = await CourseIntro.findOne({
      courseId,
      isDeleted: false,
    }).session(session);
    if (!intro) throw new ErrorHandler("Intro not found", 404);

    intro.blocks = blocks;
    await intro.save({ session });

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Reorder complete for Course: ${courseId}`,
    );
    return { updatedBlocksCount: blocks.length };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteCourseIntroService = async (courseId, requestId) => {
  const result = await CourseIntro.findOneAndUpdate(
    { courseId, isDeleted: false },
    { $set: { isDeleted: true } },
  );

  if (!result) {
    throw new ErrorHandler(
      "Intro not found or already deleted",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  logger.warn(
    `[${requestId}] Service: Intro soft-deleted for Course: ${courseId}`,
  );
  return true;
};

export const hardDeleteCourseIntroService = async (courseId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const intro = await CourseIntro.findOne({ courseId }).session(session);

    if (!intro) {
      logger.error(`[${requestId}] Service: Cannot hard delete. Intro not found for Course: ${courseId}`);
      throw new ErrorHandler(
        "Course introduction not found in records", 
        HTTP_STATUS.NOT_FOUND, 
        ERROR_CODES.NOT_FOUND
      );
    }

    await CourseIntro.findOneAndDelete({ courseId }).session(session);

    await session.commitTransaction();
    logger.info(`[${requestId}] Service: HARD DELETE SUCCESSFUL for Course: ${courseId}`);
    
    return true;
  } catch (error) {
    await session.abortTransaction();
    
    if (!(error instanceof ErrorHandler)) {
      logger.error(`[${requestId}] Service: Hard Delete Error: ${error.message}`);
      throw new ErrorHandler(
        "Critical error during permanent deletion", 
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        ERROR_CODES.INTERNAL_ERROR
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};
