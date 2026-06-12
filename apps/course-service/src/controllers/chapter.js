import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import Chapter from "../models/chapterModel.js";
import {
  createChapterService,
  getChapterByIdService,
  getChaptersByCourseService,
  hardDeleteChapterService,
  reorderChaptersService,
  softDeleteChapterService,
  updateChapterService,
} from "../services/chapter.service.js";

export const createChapter = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";

  logger.info(
    `[${requestId}] Controller: Initiating chapter creation - Title: ${req.body.title}`,
  );

  const chapter = await createChapterService(
    req.body,
    req.user?._id,
    requestId,
  );

  logger.info(
    `[${requestId}] Controller: Chapter created successfully - ID: ${chapter._id}`,
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Chapter created successfully",
    chapter,
  );
});

export const updateChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  logger.info(
    `[${requestId}] Controller: Update request for Chapter ID: ${id}`,
  );

  const updatedChapter = await updateChapterService(
    id,
    req.body,
    req.user?._id,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Chapter updated successfully",
    updatedChapter,
  );
});

export const getChaptersByCourse = CatchAsyncError(async (req, res, next) => {
  const { courseId } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const chapters = await getChaptersByCourseService(courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Chapters fetched successfully", {
    count: chapters.length,
    chapters,
  });
});

export const getChapterById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const chapter = await getChapterByIdService(id, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Chapter details fetched successfully",
    chapter,
  );
});

export const reorderChapters = CatchAsyncError(async (req, res, next) => {
  const { courseId, chapters } = req.body;
  const requestId = req.requestId || "INTERNAL";

  console.log(req.body)

  await reorderChaptersService(courseId, chapters, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Chapters reordered successfully");
});

export const softDeleteChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  await softDeleteChapterService(id, req.user?._id, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Chapter moved to bin successfully");
});

export const hardDeleteChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const result = await hardDeleteChapterService(id, requestId);

  return sendResponse(res, HTTP_STATUS.OK, result.message);
});

export const verifyChapterInternal = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const exists = await Chapter.exists({ _id: id, isDeleted: false });

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Verification successful",
    { exists: !!exists }
  );
});
