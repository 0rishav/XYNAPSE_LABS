import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  getAdminCourseStatsService,
  getAdminUserProgressService,
  getContentStatusService,
  getCourseProgressService,
  resumeCourseService,
  updateChapterProgressService,
  updateContentProgressService,
} from "../services/progress.service.js";

export const updateContentProgress = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;
  const userId = req.user?._id;
  const { status, metadata } = req.body;

  logger.info(
    `[${requestId}] Controller: Updating content progress for Content: ${contentId}`,
  );

  const result = await updateContentProgressService(
    userId,
    contentId,
    status,
    metadata,
    requestId,
  );

  return sendResponse(res, HTTP_STATUS.OK, "Content progress updated", result);
});

export const updateChapterProgress = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { chapterId } = req.params;
  const userId = req.user?._id;
  const { status } = req.body;

  logger.info(
    `[${requestId}] Controller: Updating chapter progress for Chapter: ${chapterId}`,
  );

  const result = await updateChapterProgressService(
    userId,
    chapterId,
    status,
    requestId,
  );

  return sendResponse(res, HTTP_STATUS.OK, "Chapter progress updated", result);
});

export const getCourseProgress = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;
  const userId = req.user?._id;

  logger.info(
    `[${requestId}] Controller: Fetching course progress for User: ${userId}, Course: ${courseId}`,
  );

  const progressData = await getCourseProgressService(
    userId,
    courseId,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course progress fetched successfully",
    progressData,
  );
});

export const getContentStatus = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { contentId } = req.params;
  const userId = req.user?._id;

  logger.info(
    `[${requestId}] Controller: Fetching status for Content: ${contentId}`,
  );

  const status = await getContentStatusService(userId, contentId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Content status fetched", status);
});

export const resumeCourse = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;
  const userId = req.user?._id;

  logger.info(
    `[${requestId}] Controller: Resume course for User: ${userId}, Course: ${courseId}`,
  );

  const resumeData = await resumeCourseService(userId, courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Resume data fetched", resumeData);
});

export const getAdminUserProgress = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { userId } = req.params;

  logger.info(
    `[${requestId}] Controller: Admin fetching progress for User: ${userId}`,
  );

  const progress = await getAdminUserProgressService(userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "User progress fetched successfully",
    progress,
  );
});

export const getAdminCourseStats = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Admin fetching stats for Course: ${courseId}`,
  );

  const stats = await getAdminCourseStatsService(courseId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course stats fetched successfully",
    stats,
  );
});
