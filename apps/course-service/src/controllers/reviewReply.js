import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createReplyService,
  deleteReplyService,
  getAllRepliesAdminService,
  getRepliesByReviewService,
  hardDeleteReplyService,
  likeReplyService,
  updateReplyService,
} from "../services/review-reply.service.js";

export const createReply = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;
  const { replyText } = req.body;
  const userId = req.user._id;

  const reply = await createReplyService(
    userId,
    reviewId,
    replyText,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Reply added successfully",
    reply,
  );
});

export const getReviewReplies = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { reviewId } = req.params;

  const replies = await getRepliesByReviewService(reviewId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Replies fetched successfully",
    replies,
  );
});

export const updateReply = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { replyId } = req.params;
  const { replyText } = req.body;
  const userId = req.user._id;

  const updatedReply = await updateReplyService(
    userId,
    replyId,
    replyText,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Reply updated successfully",
    updatedReply,
  );
});

export const deleteReply = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { replyId } = req.params;
  const userId = req.user._id;

  await deleteReplyService(userId, replyId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Reply deleted successfully", null);
});

export const likeReply = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { replyId } = req.params;

  const reply = await likeReplyService(replyId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Reply liked", {
    likesCount: reply.likesCount,
  });
});

export const getAdminReplies = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const data = await getAllRepliesAdminService(page, limit, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "All replies fetched for moderation",
    data,
  );
});

export const hardDeleteReply = CatchAsyncError(async (req, res) => {
  const requestId = req.requestId || "INTERNAL";
  const { replyId } = req.params;

  await hardDeleteReplyService(replyId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Reply deleted permanently from database",
    null,
  );
});
