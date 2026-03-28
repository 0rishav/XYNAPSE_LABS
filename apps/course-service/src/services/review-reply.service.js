import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Review from "../models/reviewModel.js";
import ReviewReply from "../models/reviewReplyModel.js";
import { fetchUsersFromAuthService } from "../utils/userServiceCall.js";

export const createReplyService = async (
  userId,
  reviewId,
  replyText,
  requestId,
) => {

  const review = await Review.findById(reviewId).lean();
  if (!review) {
    throw new ErrorHandler("Parent review not found", HTTP_STATUS.NOT_FOUND);
  }

  const reply = await ReviewReply.create({
    reviewId,
    userId,
    replyText,
  });

  logger.info(
    `[${requestId}] Service: Reply created for Review ${reviewId} by User ${userId}`,
  );
  return reply;
};

export const getRepliesByReviewService = async (reviewId, requestId) => {
  const replies = await ReviewReply.find({ reviewId, isDeleted: false })
    .sort({ createdAt: 1 })
    .lean();

  if (replies.length === 0) return [];

  const userIds = [...new Set(replies.map((r) => r.userId.toString()))];

  const users = await fetchUsersFromAuthService(userIds, requestId);

  const enrichedReplies = replies.map((reply) => {
    const user = users.find(
      (u) => u._id.toString() === reply.userId.toString(),
    );
    return {
      ...reply,
      user: user
        ? { name: user.name, image: user.image, role: user.role }
        : { name: "Ghost User", image: null, role: "user" },
    };
  });

  logger.info(
    `[${requestId}] Service: Fetched ${enrichedReplies.length} replies for Review ${reviewId}`,
  );
  return enrichedReplies;
};

export const updateReplyService = async (userId, replyId, replyText, requestId) => {
  const reply = await ReviewReply.findOne({ _id: replyId, userId, isDeleted: false });

  if (!reply) {
    logger.error(`[${requestId}] Service: Reply not found or unauthorized: ${replyId}`);
    throw new ErrorHandler("Reply not found or unauthorized", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  reply.replyText = replyText;
  await reply.save();

  logger.info(`[${requestId}] Service: Reply ${replyId} updated by user ${userId}`);
  return reply;
};

export const deleteReplyService = async (userId, replyId, requestId) => {
  const reply = await ReviewReply.findOneAndUpdate(
    { _id: replyId, userId, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!reply) {
    logger.error(`[${requestId}] Service: Failed to delete reply ${replyId}. Not found or unauthorized.`);
    throw new ErrorHandler("Unauthorized or reply already deleted", HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED);
  }

  logger.info(`[${requestId}] Service: Reply ${replyId} soft-deleted by user ${userId}`);
  return true;
};

export const likeReplyService = async (replyId, requestId) => {
  const reply = await ReviewReply.findOneAndUpdate(
    { _id: replyId, isDeleted: false },
    { $inc: { likesCount: 1 } },
    { new: true }
  ).lean();

  if (!reply) {
    throw new ErrorHandler("Reply not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  logger.info(`[${requestId}] Service: Reply ${replyId} liked. New count: ${reply.likesCount}`);
  return reply;
};

export const getAllRepliesAdminService = async (page, limit, requestId) => {
  const skip = (page - 1) * limit;

  const [replies, total] = await Promise.all([
    ReviewReply.find()
      .populate("reviewId", "reviewText") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ReviewReply.countDocuments(),
  ]);

  if (replies.length === 0) {
    return { replies: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const userIds = [...new Set(replies.map((r) => r.userId.toString()))];
  const usersData = await fetchUsersFromAuthService(userIds, requestId);

  const enrichedReplies = replies.map((reply) => {
    const user = usersData.find((u) => u._id.toString() === reply.userId.toString());
    return {
      ...reply,
      user: user ? { 
        name: user.name, 
        email: user.email, 
        image: user.image, 
        role: user.role 
      } : { name: "Unknown", email: "N/A" }
    };
  });

  return {
    replies: enrichedReplies,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

export const hardDeleteReplyService = async (replyId, requestId) => {
  const reply = await ReviewReply.findByIdAndDelete(replyId);

  if (!reply) {
    logger.error(`[${requestId}] Admin Service: Reply not found for permanent deletion: ${replyId}`);
    throw new ErrorHandler("Reply not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  logger.info(`[${requestId}] Admin Service: Reply ${replyId} permanently deleted by admin`);
  return true;
};
