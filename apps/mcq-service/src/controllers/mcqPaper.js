import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";

import MCQPaper from "../models/mcqPaperModel.js";
import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQSubmission from "../models/mcqSubmissionModal.js";
import fs from "fs";
import {
  addQuestionToPaperService,
  createPaperService,
  getPaperQuestionsService,
  getPaperWithDetailsService,
  listPapersService,
  listPapersWithQuestionsService,
  removeQuestionFromPaperService,
  updatePaperService,
  updatePaperStatusService,
} from "../services/mcqPaper.service.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { verifyChapterExists } from "../internal-api/verifyChapterExist.js";
import { verifyCourseExists } from "../internal-api/verifyCourseExist.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";


export const createMCQPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { chapterId, courseId, title, maxAttempts } = req.body;

  if (!title || !chapterId) {
    return next(
      new ErrorHandler(
        "Title and ChapterId are required",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
  }

  const isChapterValid = await verifyChapterExists(chapterId, requestId);
  if (!isChapterValid)
    return next(new ErrorHandler("Invalid ChapterId", HTTP_STATUS.NOT_FOUND));

  if (courseId) {
    const isCourseValid = await verifyCourseExists(courseId, requestId);
    if (!isCourseValid)
      return next(new ErrorHandler("Invalid CourseId", HTTP_STATUS.NOT_FOUND));
  }

  try {
    const paper = await createPaperService(
      req.body,
      req.file,
      req.user?._id,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "MCQ Paper created successfully",
      paper,
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller: ${error.message}`);
    return next(
      new ErrorHandler(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error(`[${requestId}] Cleanup failed: ${err.message}`);
      });
    }
  }
});

export const updateMCQPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;
  const { chapterId, courseId } = req.body;

  if (chapterId) {
    const isChapterValid = await verifyChapterExists(chapterId, requestId);
    if (!isChapterValid)
      return next(new ErrorHandler("Invalid ChapterId", HTTP_STATUS.NOT_FOUND));
  }

  if (courseId) {
    const isCourseValid = await verifyCourseExists(courseId, requestId);
    if (!isCourseValid)
      return next(new ErrorHandler("Invalid CourseId", HTTP_STATUS.NOT_FOUND));
  }

  try {
    const paper = await updatePaperService(
      id,
      req.body,
      req.file,
      req.user?._id,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "MCQ Paper updated successfully",
      paper,
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller: ${error.message}`);
    return next(
      new ErrorHandler(
        error.message,
        error.message === "Paper not found"
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.error(`[${requestId}] Cleanup failed: ${err.message}`);
      });
    }
  }
});

export const updatePaperStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const requestId = req.locals?.requestId || "INTERNAL";

  const allowedStatuses = ["draft", "published", "archived"];
  if (!allowedStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status value", HTTP_STATUS.BAD_REQUEST));
  }

  const updatedPaper = await updatePaperStatusService(id, status, req.user?._id, requestId);

  if (!updatedPaper) {
    return next(new ErrorHandler("Paper not found", HTTP_STATUS.NOT_FOUND));
  }

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Paper status updated successfully",
    updatedPaper,
  );
});

export const deleteMCQPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;

  try {
    await deletePaperService(id, requestId);

    return sendResponse(res, HTTP_STATUS.OK, "MCQ Paper deleted successfully");
  } catch (error) {
    logger.error(`[${requestId}] Controller error: ${error.message}`);

    const statusCode =
      error.message === "Paper not found"
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const getMCQPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;

  const paper = await getPaperWithDetailsService(id, requestId);

  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";

  if (!isAdmin) {
    if (paper.availability !== "active")
      return next(
        new ErrorHandler("Paper not accessible", HTTP_STATUS.FORBIDDEN),
      );

    if (paper.status !== "published")
      return next(
        new ErrorHandler("Paper not accessible", HTTP_STATUS.FORBIDDEN),
      );

    if (paper.visibility === "private" && !req.isPaidForLab) {
      return next(
        new ErrorHandler(
          "Payment required to access this paper",
          HTTP_STATUS.PAYMENT_REQUIRED,
        ),
      );
    }

    if (paper.visibility === "restricted") {
      return next(
        new ErrorHandler("Paper is restricted", HTTP_STATUS.FORBIDDEN),
      );
    }
  }

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "MCQ Paper fetched successfully",
    paper,
  );
});

export const listMCQPapers = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { chapterId, status } = req.query;
  const userId = req.user?._id;

  const query = { isDeleted: false };
  if (chapterId) query.chapterId = chapterId;
  if (status && String(status).toLowerCase() !== "any") {
    query.status = String(status).toLowerCase();
  }

  const isAdmin = req.user?.role === "admin";
  if (!isAdmin) {
    query.status = "published";
    query.availability = "active";
  }

  try {
    const { papers } = await listPapersService(query, userId, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "MCQ Papers fetched successfully",
      {
        papers,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller: ${error.message}`);
    return next(
      new ErrorHandler(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );
  }
});

export const getPaperQuestions = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;
  const { status } = req.query;

  try {
    const data = await getPaperQuestionsService(id, status, requestId);

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin) {
      if (data.availability !== "active")
        return next(
          new ErrorHandler("Paper not accessible", HTTP_STATUS.FORBIDDEN),
        );
      if (data.status !== "published")
        return next(
          new ErrorHandler("Paper not accessible", HTTP_STATUS.FORBIDDEN),
        );
      if (data.visibility === "private" && !req.isPaidUser)
        return next(
          new ErrorHandler("Payment required", HTTP_STATUS.PAYMENT_REQUIRED),
        );
      if (data.visibility === "restricted")
        return next(
          new ErrorHandler("Paper is restricted", HTTP_STATUS.FORBIDDEN),
        );
    }

    return sendResponse(res, HTTP_STATUS.OK, "Questions fetched successfully", {
      paper: {
        ...data,
        questions: undefined,
      },
      questions: data.questions,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller: ${error.message}`);
    const statusCode =
      error.message === "Paper not found"
        ? HTTP_STATUS.NOT_FOUND
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const addQuestionToPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;
  const { questionId } = req.body;

  if (!questionId) {
    return next(
      new ErrorHandler("questionId is required", HTTP_STATUS.BAD_REQUEST),
    );
  }

  try {
    const updatedPaper = await addQuestionToPaperService(
      id,
      questionId,
      requestId,
    );

    return sendResponse(res, HTTP_STATUS.OK, "Question added to paper", {
      paper: updatedPaper,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message === "Paper not found") statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message === "Question not found")
      statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message === "Question belongs to a different chapter")
      statusCode = HTTP_STATUS.BAD_REQUEST;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const removeQuestionFromPaper = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;
  const { questionId } = req.body;

  if (!questionId) {
    return next(new ErrorHandler("questionId is required", HTTP_STATUS.BAD_REQUEST));
  }

  try {
    const updatedPaper = await removeQuestionFromPaperService(id, questionId, requestId);

    return sendResponse(res, HTTP_STATUS.OK, "Question removed from paper", {
      paper: updatedPaper,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message === "Paper not found") statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message === "Question not found in this paper") statusCode = HTTP_STATUS.NOT_FOUND;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const listMCQPapersWithQuestions = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { courseId, chapterId, status } = req.query;

  // Schema ke according strict validation
  if (!chapterId) {
    return next(new ErrorHandler("chapterId is required", HTTP_STATUS.BAD_REQUEST));
  }

  try {
    const result = await listPapersWithQuestionsService(
      { courseId, chapterId, status },
      req.user,
      requestId
    );

    return sendResponse(res, HTTP_STATUS.OK, "Papers fetched successfully", {
      papers: result,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);
    return next(new ErrorHandler(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR));
  }
});
