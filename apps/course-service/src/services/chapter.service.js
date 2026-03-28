import mongoose from "mongoose";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Chapter from "../models/chapterModel.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import slugify from "slugify";

export const createChapterService = async (data, userId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courseId, title, order } = data;
    logger.info(
      `[${requestId}] Service: Starting chapter creation for Course: ${courseId}`,
    );

    const generatedSlug = slugify(title, { lower: true, strict: true });

    const existingChapter = await Chapter.findOne({
      courseId,
      $or: [{ order }, { slug: generatedSlug }],
    }).session(session);

    if (existingChapter) {
      logger.warn(
        `[${requestId}] Service: Conflict detected - Order ${order} or Slug ${generatedSlug} exists`,
      );
      throw new ErrorHandler(
        "Chapter with this order or title already exists in this course",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }

    const chapter = await Chapter.create(
      [
        {
          ...data,
          slug: generatedSlug,
          createdBy: userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Transaction committed. Chapter ID: ${chapter[0]._id}`,
    );

    return chapter[0];
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Transaction aborted. Error: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateChapterService = async (
  chapterId,
  updateData,
  userId,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(
      `[${requestId}] Service: Fetching chapter for update: ${chapterId}`,
    );

    if (updateData.title) {
      updateData.slug = slugify(updateData.title, {
        lower: true,
        strict: true,
      });
    }

    updateData.updatedBy = userId;

    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { $set: updateData },
      { new: true, runValidators: true, session },
    );

    if (!updatedChapter) {
      throw new ErrorHandler(
        "Chapter not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Chapter updated successfully: ${chapterId}`,
    );

    return updatedChapter;
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Update failed for Chapter ${chapterId}: ${error.message}`,
    );

    if (error.code === 11000) {
      throw new ErrorHandler(
        "Conflict: Title or Order already exists in this course",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const getChaptersByCourseService = async (courseId, requestId) => {
  logger.info(
    `[${requestId}] Service: Fetching all chapters for Course: ${courseId}`,
  );

  const chapters = await Chapter.find({ courseId, isDeleted: false })
    .sort({ order: 1 })
    .lean();

  return chapters;
};

export const getChapterByIdService = async (chapterId, requestId) => {
  logger.info(
    `[${requestId}] Service: Fetching Chapter Details for ID: ${chapterId}`,
  );

  const chapter = await Chapter.findOne({
    _id: chapterId,
    isDeleted: false,
  }).lean();

  if (!chapter) {
    throw new ErrorHandler(
      "Chapter not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return chapter;
};

export const reorderChaptersService = async (courseId, chaptersArray, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`[${requestId}] Service: Reordering chapters for Course: ${courseId}`);

    const normalizedChapters = Array.isArray(chaptersArray) 
      ? chaptersArray 
      : Object.values(chaptersArray);

    if (!normalizedChapters.length) {
      throw new Error("No chapters provided for reordering");
    }

    
    const tempOps = normalizedChapters.map((item) => ({
      updateOne: {
        filter: { _id: item.id, courseId },
        update: { $set: { order: -item.order } },
      },
    }));

    const finalOps = normalizedChapters.map((item) => ({
      updateOne: {
        filter: { _id: item.id, courseId },
        update: { $set: { order: item.order } }, 
      },
    }));

    const result = await Chapter.bulkWrite([...tempOps, ...finalOps], { session, ordered: true });

    await session.commitTransaction();
    
    logger.info(`[${requestId}] Service: Successfully reordered ${normalizedChapters.length} chapters`);
    
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Service: Reordering failed: ${error.message}`);
    
    if (error.code === 11000) {
       throw new Error("Duplicate order detected in the request or database.");
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const softDeleteChapterService = async (chapterId, userId, requestId) => {
  logger.info(`[${requestId}] Service: Soft deleting chapter: ${chapterId}`);

  const chapter = await Chapter.findByIdAndUpdate(
    chapterId,
    { $set: { isDeleted: true, updatedBy: userId } },
    { new: true }
  );

  if (!chapter) {
    throw new ErrorHandler("Chapter not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return chapter;
};

export const hardDeleteChapterService = async (chapterId, requestId) => {
  logger.info(`[${requestId}] Service: Hard deleting chapter: ${chapterId}`);

  const chapter = await Chapter.findByIdAndDelete(chapterId);

  if (!chapter) {
    throw new ErrorHandler("Chapter not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return { message: "Chapter permanently deleted" };
};

