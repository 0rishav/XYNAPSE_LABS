import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQSubmission from "../models/mcqSubmissionModal.js";
import MCQPaper from "../models/mcqPaperModel.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import {
  createSubmissionService,
  deleteSubmissionService,
  evaluateSubmissionService,
  finalizeSubmissionService,
  getAllSubmissionsService,
  getCourseStatsService,
  getMySubmissionsService,
  getQuestionStatsService,
  getSubmissionByIdService,
  getUserStatsService,
  reviewSubmissionService,
  updateSubmissionStatusService,
} from "../services/mcqSubmission.service.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";

export const createMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;

  const { chapterId, courseId, paperId, answers, mode = "practice" } = req.body;

  if (!chapterId || !paperId)
    return next(
      new ErrorHandler("Missing required fields", HTTP_STATUS.BAD_REQUEST),
    );

  try {
    const result = await createSubmissionService(
      { chapterId, courseId, paperId, answers, mode },
      userId,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "MCQ submission created",
      result,
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message.includes("Invalid")) statusCode = HTTP_STATUS.NOT_FOUND;
    if (
      error.message.includes("not found") ||
      error.message.includes("inactive")
    )
      statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message.includes("Maximum attempts"))
      statusCode = HTTP_STATUS.BAD_REQUEST;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const getMyMCQSubmissions = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;

  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  try {
    const { data } = await getMySubmissionsService(
      userId,
      page,
      limit,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submissions fetched successfully",
      {
        submissions: data,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);
    return next(
      new ErrorHandler(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );
  }
});

export const getMCQSubmissionById = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;
  const { id } = req.params;

  try {
    const { data, attemptInfo } = await getSubmissionByIdService(
      userId,
      id,
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submission fetched successfully",
      {
        submission: data,
        attemptInfo,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    return next(
      new ErrorHandler(
        error.message === "Submission not found"
          ? "Submission not found"
          : error.message,
        error.message === "Submission not found"
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  }
});

export const deleteMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;
  const { id } = req.params;

  try {
    await deleteSubmissionService(userId, id, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submission deleted successfully (soft delete)",
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    return next(
      new ErrorHandler(
        error.message,
        error.message === "Submission not found or already deleted"
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  }
});

export const evaluateMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { id } = req.params;

  try {
    const submission = await evaluateSubmissionService(id, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submission evaluated successfully",
      {
        submission,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    // Mapping errors
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message === "Submission not found")
      statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message === "Submission already evaluated")
      statusCode = HTTP_STATUS.BAD_REQUEST;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const finalizeMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;
  const { id } = req.params;

  try {
    const submission = await finalizeSubmissionService(userId, id, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submission finalized successfully",
      {
        submission,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message === "Submission not found")
      statusCode = HTTP_STATUS.NOT_FOUND;
    if (error.message === "Submission already finalized")
      statusCode = HTTP_STATUS.BAD_REQUEST;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const reviewMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;
  const { id } = req.params;

  try {
    const review = await reviewSubmissionService(userId, id, requestId);

    return sendResponse(res, HTTP_STATUS.OK, "Review fetched successfully", {
      review,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    return next(
      new ErrorHandler(
        error.message === "Submission not found"
          ? "Submission not found"
          : error.message,
        error.message === "Submission not found"
          ? HTTP_STATUS.NOT_FOUND
          : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  }
});

export const getUserMCQStats = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const userId = req.user?._id;

  try {
    const stats = await getUserStatsService(userId, requestId);

    return sendResponse(res, HTTP_STATUS.OK, "MCQ Stats Fetched !!", {
      stats,
    });
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    return next(
      new ErrorHandler(
        error.message || "Failed to fetch stats",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  }
});

export const getLabMCQStats = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { courseId } = req.params;

  if (!courseId) {
    return next(
      new ErrorHandler("courseId is required", HTTP_STATUS.BAD_REQUEST),
    );
  }

  try {
    const stats = await getCourseStatsService(courseId, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Course MCQ Stats fetched successfully",
      {
        stats,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    // Mapping error
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    if (error.message === "Invalid CourseId")
      statusCode = HTTP_STATUS.NOT_FOUND;

    return next(new ErrorHandler(error.message, statusCode));
  }
});

export const getQuestionMCQStats = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { questionId } = req.params;

  if (!questionId) {
    return next(
      new ErrorHandler("questionId is required", HTTP_STATUS.BAD_REQUEST),
    );
  }

  try {
    const stats = await getQuestionStatsService(questionId, requestId);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Question stats fetched successfully",
      {
        stats,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);

    return next(
      new ErrorHandler(
        error.message || "Failed to fetch question stats",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ),
    );
  }
});

export const getAllMCQSubmissions = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { page = 1, limit = 50 } = req.query;

  try {
    const { submissions, total } = await getAllSubmissionsService(
      parseInt(page),
      parseInt(limit),
      requestId,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Submissions fetched successfully",
      {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        submissions,
      },
    );
  } catch (error) {
    logger.error(`[${requestId}] Controller Error: ${error.message}`);
    return next(
      new ErrorHandler(error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );
  }
});

export const hardDeleteMCQSubmission = CatchAsyncError(
  async (req, res, next) => {
    const requestId = req.locals?.requestId || "INTERNAL";
    const { id } = req.params;

    try {
      await hardDeleteSubmissionService(id, requestId);

      return sendResponse(res, HTTP_STATUS.OK, "Submission hard deleted");
    } catch (error) {
      logger.error(`[${requestId}] Controller Error: ${error.message}`);

      return next(
        new ErrorHandler(
          error.message === "Submission not found"
            ? "Submission not found"
            : error.message,
          error.message === "Submission not found"
            ? HTTP_STATUS.NOT_FOUND
            : HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  },
);

export const updateMCQSubmissionStatus = CatchAsyncError(
  async (req, res, next) => {
    const requestId = req.locals?.requestId || "INTERNAL";
    const { id } = req.params;
    const { status } = req.body;

    try {
      const submission = await updateSubmissionStatusService(
        id,
        status,
        requestId,
      );

      return sendResponse(res, HTTP_STATUS.OK, "Submission status updated", {
        submission,
      });
    } catch (error) {
      logger.error(`[${requestId}] Controller Error: ${error.message}`);

      let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

      if (error.message === "Invalid status value")
        statusCode = HTTP_STATUS.BAD_REQUEST;
      if (error.message === "Submission not found")
        statusCode = HTTP_STATUS.NOT_FOUND;

      return next(new ErrorHandler(error.message, statusCode));
    }
  },
);
