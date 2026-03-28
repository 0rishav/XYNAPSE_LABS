import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  getCourseStatsService,
  getLikeStatusService,
  incrementCounterService,
  toggleLikeService,
} from "../services/interaction.service.js";

export const toggleLike = CatchAsyncError(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const requestId = req.requestId || "INTERNAL";

  const result = await toggleLikeService(courseId, userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    result.isLiked ? "Course liked" : "Course unliked",
    { isLiked: result.isLiked },
  );
});

export const getLikeStatus = CatchAsyncError(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const requestId = req.requestId || "INTERNAL";

  const isLiked = await getLikeStatusService(courseId, userId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Like status fetched", { isLiked });
});

export const incrementView = CatchAsyncError(async (req, res) => {
  const { courseId } = req.params;
  const requestId = req.requestId || "INTERNAL";

  await incrementCounterService(
    courseId,
    "views",
    requestId,
  );

  return sendResponse(res, HTTP_STATUS.OK, "View incremented successfully");
});

export const incrementShare = CatchAsyncError(async (req, res) => {
  const { courseId } = req.params;
  const requestId = req.requestId || "INTERNAL";

  await incrementCounterService(courseId, "sharesCount", requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Share incremented successfully");
});

export const getStats = CatchAsyncError(async (req, res) => {
  const { courseId } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const stats = await getCourseStatsService(courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Course stats fetched", stats);
});
