import mongoose from "mongoose";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import Review from "../models/reviewModel.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Course from "../models/courseModel.js";
import { syncCourseStats, updateCourseStats } from "../utils/courseStats.js";
import { fetchUsersFromAuthService } from "../utils/userServiceCall.js";

export const createReviewService = async (
  userId,
  courseId,
  rating,
  reviewText,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.create(
      [{ courseId, userId, rating, reviewText }],
      { session },
    );

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
          avgRating: { $sum: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]).session(session);

    if (stats.length > 0) {
      const average = parseFloat(
        (stats[0].avgRating / stats[0].count).toFixed(1),
      );

      await Course.findByIdAndUpdate(
        courseId,
        {
          averageRating: average,
          totalReviewsCount: stats[0].count,
        },
        { session, new: true },
      );
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Review created & Course ${courseId} updated.`,
    );

    return review[0];
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      throw new ErrorHandler(
        "You have already reviewed this course",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }

    if (!(error instanceof ErrorHandler)) {
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

export const getCourseReviewsService = async (
  courseId,
  page,
  limit,
  sort,
  requestId
) => {
  try {
    const skip = (page - 1) * limit;

    const sortQuery =
      sort === "helpful"
        ? { likesCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    logger.info(
      `[${requestId}] Service: Fetching reviews for Course: ${courseId} | Page: ${page} | Sort: ${sort}`
    );

    const [reviews, total] = await Promise.all([
      Review.find({ courseId, isPublished: true })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ courseId, isPublished: true }),
    ]);

    if (reviews.length === 0) {
      return {
        reviews: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const userIds = [...new Set(reviews.map((r) => r.userId.toString()))];

    const usersData = await fetchUsersFromAuthService(userIds, requestId);

    const enrichedReviews = reviews.map((review) => {
      const user = usersData.find((u) => u._id.toString() === review.userId.toString());
      
      return {
        ...review,
        user: user 
          ? { name: user.name, image: user.image, role: user.role } 
          : { name: "Ghost User", image: null, role: "user" }, 
      };
    });

    logger.info(
      `[${requestId}] Service: Successfully enriched ${enrichedReviews.length} reviews with user data`
    );

    return {
      reviews: enrichedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      `[${requestId}] Service: Error fetching reviews for course ${courseId}: ${error.message}`
    );

    throw new ErrorHandler(
      "Failed to fetch reviews",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
};

export const updateReviewService = async (
  userId,
  reviewId,
  rating,
  reviewText,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.findOne({ _id: reviewId, userId }).session(
      session,
    );
    if (!review) {
      logger.error(
        `[${requestId}] Service: Review not found or unauthorized. ID: ${reviewId}`,
      );
      throw new ErrorHandler(
        "Review not found or unauthorized",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (rating) review.rating = rating;
    if (reviewText !== undefined) review.reviewText = reviewText;
    await review.save({ session });

    await updateCourseStats(review.courseId, session, requestId);

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Review ${reviewId} updated and stats synced.`,
    );
    return review;
  } catch (error) {
    await session.abortTransaction();
    throw error instanceof ErrorHandler
      ? error
      : new ErrorHandler(
          error.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.INTERNAL_ERROR,
        );
  } finally {
    session.endSession();
  }
};

export const deleteReviewService = async (userId, reviewId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.findOne({ _id: reviewId, userId }).session(
      session,
    );
    if (!review) {
      throw new ErrorHandler(
        "Review not found or unauthorized",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const courseId = review.courseId;
    await Review.deleteOne({ _id: reviewId }).session(session);

    await updateCourseStats(courseId, session, requestId);

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Review ${reviewId} deleted and stats synced.`,
    );
  } catch (error) {
    await session.abortTransaction();
    throw error instanceof ErrorHandler
      ? error
      : new ErrorHandler(
          error.message,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.INTERNAL_ERROR,
        );
  } finally {
    session.endSession();
  }
};

export const likeReviewService = async (reviewId, requestId) => {
  try {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likesCount: 1 } },
      { new: true, runValidators: true },
    ).lean();

    if (!review) {
      logger.error(
        `[${requestId}] Service: Review not found for like: ${reviewId}`,
      );
      throw new ErrorHandler(
        "Review not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    logger.info(
      `[${requestId}] Service: Review ${reviewId} liked. Total likes: ${review.likesCount}`,
    );
    return review;
  } catch (error) {
    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Like review error: ${error.message}`,
      );
      throw new ErrorHandler(
        error.message,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  }
};

export const getAdminReviewsService = async (
  page,
  limit,
  rating,
  isPublished,
  requestId,
) => {
  try {
    const skip = (page - 1) * limit;

    const filter = {};
    if (rating) filter.rating = Number(rating);
    if (isPublished !== undefined) filter.isPublished = isPublished === "true";

    logger.info(
      `[${requestId}] Service: Admin query filters: ${JSON.stringify(filter)}`,
    );

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("courseId", "title") 
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    if (reviews.length === 0) {
      return {
        reviews: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const userIds = [...new Set(reviews.map((r) => r.userId.toString()))];

    const usersData = await fetchUsersFromAuthService(userIds, requestId);

    const enrichedReviews = reviews.map((review) => {
      const user = usersData.find((u) => u._id.toString() === review.userId.toString());
      
      return {
        ...review,
        user: user 
          ? { 
              name: user.name, 
              image: user.image, 
              role: user.role,
              email: user.email 
            } 
          : { name: "Unknown User", image: null, role: "user", email: "N/A" },
      };
    });

    logger.info(
      `[${requestId}] Service: Admin fetched ${enrichedReviews.length} enriched reviews`,
    );

    return {
      reviews: enrichedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(
      `[${requestId}] Service: Admin fetch reviews error: ${error.message}`,
    );
    throw new ErrorHandler(
      "Failed to fetch admin reviews",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
};

export const updateReviewStatusService = async (reviewId, isPublished, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const review = await Review.findById(reviewId).session(session);
    if (!review) throw new ErrorHandler("Review not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    review.isPublished = isPublished;
    await review.save({ session });

    await syncCourseStats(review.courseId, session, requestId);

    await session.commitTransaction();
    logger.info(`[${requestId}] Admin Service: Status updated for review ${reviewId}`);
    return review;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Admin Service Error (Status): ${error.message}`);
    throw error instanceof ErrorHandler ? error : new ErrorHandler(error.message, 500);
  } finally {
    session.endSession();
  }
};

export const deleteReviewByAdminService = async (reviewId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const review = await Review.findById(reviewId).session(session);
    if (!review) throw new ErrorHandler("Review not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

    const courseId = review.courseId;
    await Review.findByIdAndDelete(reviewId).session(session);

    await syncCourseStats(courseId, session, requestId);

    await session.commitTransaction();
    logger.info(`[${requestId}] Admin Service: Review ${reviewId} permanently deleted`);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Admin Service Error (Delete): ${error.message}`);
    throw error instanceof ErrorHandler ? error : new ErrorHandler(error.message, 500);
  } finally {
    session.endSession();
  }
};
