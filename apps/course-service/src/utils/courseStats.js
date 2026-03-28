import mongoose from "mongoose";
import logger from "../../../../packages/common/src/utils/logger.js";
import Course from "../models/courseModel.js";
import Review from "../models/reviewModel.js";

export const updateCourseStats = async (courseId, session, requestId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        isPublished: true,
      },
    },
    {
      $group: {
        _id: "$courseId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]).session(session);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(
      courseId,
      {
        averageRating: parseFloat(stats[0].avgRating.toFixed(1)),
        totalReviewsCount: stats[0].count,
      },
      { session },
    );
  } else {
    await Course.findByIdAndUpdate(
      courseId,
      { averageRating: 0, totalReviewsCount: 0 },
      { session },
    );
  }
  logger.info(`[${requestId}] Internal: Course ${courseId} stats updated.`);
};

export const syncCourseStats = async (courseId, session, requestId) => {
  const stats = await Review.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId), isPublished: true } },
    { $group: { _id: "$courseId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]).session(session);

  const updateData = stats.length > 0 
    ? { averageRating: parseFloat(stats[0].avgRating.toFixed(1)), totalReviewsCount: stats[0].count }
    : { averageRating: 0, totalReviewsCount: 0 };

  await Course.findByIdAndUpdate(courseId, updateData, { session });
  logger.info(`[${requestId}] Internal: Course stats synced for ID: ${courseId}`);
};
