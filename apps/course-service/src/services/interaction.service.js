import mongoose from "mongoose";
import logger from "../../../../packages/common/src/utils/logger.js";
import CourseLike from "../models/courseLikeModel.js";
import CourseStats from "../models/courseStatsModel.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

export const toggleLikeService = async (courseId, userId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(
      `[${requestId}] InteractionService: Toggling like for course ${courseId} by user ${userId}`,
    );

    const existingLike = await CourseLike.findOne({ courseId, userId }).session(
      session,
    );

    let isLiked;
    if (existingLike) {
      await CourseLike.deleteOne({ _id: existingLike._id }).session(session);

      await CourseStats.findOneAndUpdate(
        { courseId },
        { $inc: { likesCount: -1 } },
        { upsert: true, session },
      );

      isLiked = false;
      logger.info(
        `[${requestId}] InteractionService: Course unliked successfully`,
      );
    } else {
      await CourseLike.create([{ courseId, userId }], { session });

      await CourseStats.findOneAndUpdate(
        { courseId },
        { $inc: { likesCount: 1 } },
        { upsert: true, session },
      );

      isLiked = true;
      logger.info(
        `[${requestId}] InteractionService: Course liked successfully`,
      );
    }

    await session.commitTransaction();
    return { isLiked };
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] InteractionService Error: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getLikeStatusService = async (courseId, userId, requestId) => {
  logger.info(
    `[${requestId}] InteractionService: Checking like status for user ${userId}`,
  );
  const like = await CourseLike.exists({ courseId, userId });
  return !!like;
};

export const incrementCounterService = async (courseId, field, requestId) => {
  logger.info(`[${requestId}] InteractionService: Incrementing ${field} for course ${courseId}`);

  const allowedFields = ["views", "sharesCount"];
  if (!allowedFields.includes(field)) {
    throw new ErrorHandler("Invalid field update", HTTP_STATUS.BAD_REQUEST);
  }

  const updatedStats = await CourseStats.findOneAndUpdate(
    { courseId },
    { $inc: { [field]: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return updatedStats;
};

export const getCourseStatsService = async (courseId, requestId) => {
  logger.info(`[${requestId}] InteractionService: Fetching stats for course ${courseId}`);
  
  const stats = await CourseStats.findOne({ courseId }).lean();
  
  if (!stats) {
    return {
      views: 0,
      likesCount: 0,
      sharesCount: 0,
      enrollmentsCount: 0
    };
  }

  return stats;
};