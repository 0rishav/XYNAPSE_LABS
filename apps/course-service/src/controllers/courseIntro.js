import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createCourseIntroService,
  deleteCourseIntroService,
  getCourseIntroService,
  hardDeleteCourseIntroService,
  reorderCourseIntroBlocksService,
  updateCourseIntroService,
  updateCourseIntroStatusService,
} from "../services/course-intro.service.js";

export const createCourseIntro = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const userId = req.user?._id;
  const introData = req.body;

  logger.info(
    `[${requestId}] Controller: Creating Course Intro for Course: ${introData.courseId}`,
  );

  const result = await createCourseIntroService(introData, userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Course Introduction created successfully",
    result,
  );
});

export const getCourseIntro = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Fetching Course Intro for Course: ${courseId}`,
  );

  const intro = await getCourseIntroService(courseId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course Introduction fetched successfully",
    intro,
  );
});

export const updateCourseIntro = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;
  const updateData = req.body;

  logger.info(
    `[${requestId}] Controller: Updating Course Intro for Course: ${courseId}`,
  );

  const result = await updateCourseIntroService(
    courseId,
    updateData,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course Introduction updated successfully",
    result,
  );
});

export const updateCourseIntroStatus = CatchAsyncError(
  async (req, res, next) => {
    const requestId = req.requestId || "INTERNAL";
    const { courseId } = req.params;
    const { isPublished } = req.body;

    const result = await updateCourseIntroStatusService(
      courseId,
      isPublished,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      `Intro ${isPublished ? "published" : "hidden"} successfully`,
      result,
    );
  },
);

export const reorderCourseIntroBlocks = CatchAsyncError(
  async (req, res, next) => {
    const requestId = req.requestId || "INTERNAL";
    const { courseId } = req.params;
    const { blocks } = req.body;

    const result = await reorderCourseIntroBlocksService(
      courseId,
      blocks,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Blocks reordered successfully",
      result,
    );
  },
);

export const deleteCourseIntro = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  await deleteCourseIntroService(courseId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course Introduction deleted successfully",
    null,
  );
});

export const hardDeleteCourseIntro = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.warn(
    `[${requestId}] Admin Controller: INITIATING HARD DELETE for Course Intro: ${courseId}`,
  );

  await hardDeleteCourseIntroService(courseId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course Introduction permanently removed from database",
    null,
  );
});
