
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import { getContentStatsService, getMyLikedContentService, shareContentService, toggleContentLikeService, trackContentViewService } from "../services/content-interaction.service.js";

export const toggleContentLike = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;
  const userId = req.user?._id;

  logger.info(`[${requestId}] Controller: Request to toggle like for Content: ${contentId}`);

  const result = await toggleContentLikeService(contentId, userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    result.message,
    result.data
  );
});

export const shareContent = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;
  const { platform } = req.body;
  const userId = req.user?._id;

  logger.info(`[${requestId}] Controller: Request to share Content: ${contentId} on ${platform}`);

  const shareRecord = await shareContentService(contentId, userId, platform, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Content shared successfully",
    shareRecord
  );
});

export const getContentStats = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;

  logger.info(`[${requestId}] Controller: Fetching stats for Content: ${contentId}`);

  const stats = await getContentStatsService(contentId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Stats fetched successfully", stats);
});

export const trackContentView = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;

  logger.info(`[${requestId}] Controller: Incrementing view for Content: ${contentId}`);

  await trackContentViewService(contentId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "View tracked successfully", null);
});

export const getMyLikedContent = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const userId = req.user?._id;

  logger.info(`[${requestId}] Controller: Fetching liked content for User: ${userId}`);

  const likedContent = await getMyLikedContentService(
    userId, 
    req.query, 
    requestId
  );

  return sendResponse(
    res, 
    HTTP_STATUS.OK, 
    "Liked content fetched successfully", 
    likedContent
  );
});