import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createReviewService,
  deleteReviewByAdminService,
  deleteReviewService,
  getAdminReviewsService,
  getCourseReviewsService,
  likeReviewService,
  updateReviewService,
  updateReviewStatusService,
} from "../services/review.service.js";

export const createReview = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;
  const userId = req.user?._id;
  const { rating, reviewText } = req.body;

  logger.info(
    `[${requestId}] Controller: Initiating review creation for Course: ${courseId}`,
  );

  const review = await createReviewService(
    userId,
    courseId,
    rating,
    reviewText,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Review submitted successfully",
    review,
  );
});

export const getCourseReviews = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;
  const { page, limit, sort } = req.query;

  logger.info(
    `[${requestId}] Controller: Fetching reviews for Course: ${courseId}`,
  );

  const data = await getCourseReviewsService(
    courseId,
    page,
    limit,
    sort,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Reviews fetched successfully",
    data,
  );
});

export const updateReview = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;
  const userId = req.user?._id;
  const { rating, reviewText } = req.body;

  logger.info(
    `[${requestId}] Controller: Updating review ${reviewId} for User: ${userId}`,
  );

  const updatedReview = await updateReviewService(
    userId,
    reviewId,
    rating,
    reviewText,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Review updated successfully",
    updatedReview,
  );
});

export const deleteReview = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;
  const userId = req.user?._id;

  logger.info(
    `[${requestId}] Controller: Deleting review ${reviewId} for User: ${userId}`,
  );

  await deleteReviewService(userId, reviewId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Review deleted successfully", null);
});

export const likeReview = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;

  logger.info(
    `[${requestId}] Controller: User ${req.user?._id} liking review ${reviewId}`,
  );

  const review = await likeReviewService(reviewId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Review liked successfully", {
    likesCount: review.likesCount,
  });
});

export const getAdminReviews = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { rating, isPublished } = req.query;

  logger.info(
    `[${requestId}] Controller: Admin fetching reviews. Page: ${page}, Limit: ${limit}`,
  );

  const data = await getAdminReviewsService(
    page,
    limit,
    rating,
    isPublished,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Admin reviews fetched successfully",
    data,
  );
});

export const updateReviewStatus = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;
  const { isPublished } = req.body;

  logger.info(
    `[${requestId}] Admin Controller: Changing status for Review ${reviewId} to ${isPublished}`,
  );

  const updatedReview = await updateReviewStatusService(
    reviewId,
    isPublished,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `Review ${isPublished ? "published" : "hidden"} successfully`,
    updatedReview,
  );
});

export const deleteReviewByAdmin = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;

  logger.info(
    `[${requestId}] Admin Controller: Admin deleting review ${reviewId}`,
  );

  await deleteReviewByAdminService(reviewId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Review deleted permanently by admin",
    null,
  );
});
