import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQPaper from "../models/mcqPaperModel.js";
import { validateMCQPayload } from "../../../../packages/common/src/utils/mcqValidator.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import {
  createQuestionService,
  deleteQuestionService,
  dislikeQuestionService,
  evaluateMCQAttemptService,
  getAllMCQQuestionsService,
  getMCQAnalyticsService,
  getQuestionByIdService,
  getRandomMCQsService,
  likeQuestionService,
  reportQuestionService,
  updateAccessLevelService,
  updateQuestionService,
  updateStatusService,
} from "../services/mcqQuestion.service.js";
import { verifyChapterExists } from "../internal-api/verifyChapterExist.js";

export const createMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  const { chapterId, paperId } = req.body;

  const isChapterValid = await verifyChapterExists(chapterId, requestId);
  if (!isChapterValid) {
    return next(new ErrorHandler("Chapter not found", HTTP_STATUS.NOT_FOUND));
  }

  if (paperId) {
    const paperExists = await MCQPaper.exists({ _id: paperId });
    if (!paperExists) {
      return next(new ErrorHandler("Invalid PaperId", HTTP_STATUS.NOT_FOUND));
    }
  }

  const mcq = await createQuestionService(req.body, req.user?._id, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "MCQ Question created successfully",
    mcq,
  );
});

export const updateMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.locals?.requestId || "INTERNAL";

  if (req.body.chapterId) {
    const isChapterValid = await verifyChapterExists(req.body.chapterId, requestId);
    
    if (!isChapterValid) {
      return next(new ErrorHandler("Invalid Chapter ID: Chapter does not exist", HTTP_STATUS.NOT_FOUND));
    }
  }

  const updatedMcq = await updateQuestionService(id, req.body, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "MCQ Question updated successfully",
    updatedMcq
  );
});

export const deleteMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.locals?.requestId || "INTERNAL";

  await deleteQuestionService(id, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "MCQ Question deleted successfully"
  );
});

export const changeMCQStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const requestId = req.locals?.requestId || "INTERNAL";

  const updatedMcq = await updateStatusService(id, status, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `MCQ Question status updated to '${status}'`,
    updatedMcq
  );
});

export const changeMCQAccessLevel = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { accessLevel } = req.body;
  const requestId = req.locals?.requestId || "INTERNAL";

  const updatedMcq = await updateAccessLevelService(id, accessLevel, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `MCQ Question accessLevel updated to '${accessLevel}'`,
    updatedMcq
  );
});

export const getMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const mcq = await getQuestionByIdService(id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "MCQ retrieved successfully",
    mcq
  );
});

export const getAllMCQQuestions = CatchAsyncError(async (req, res, next) => {
  const result = await getAllMCQQuestionsService(req.query);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "MCQs retrieved successfully",
    {
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
    }
  );
});

export const getRandomMCQs = CatchAsyncError(async (req, res, next) => {
  const requestId = req.locals?.requestId || "INTERNAL";
  
  const mcqs = await getRandomMCQsService(req.query, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Random MCQs fetched successfully",
    { count: mcqs.length, data: mcqs }
  );
});

export const attemptMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { selectedOptions } = req.body;

  if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
    return next(new ErrorHandler("Selected options are required", HTTP_STATUS.BAD_REQUEST));
  }

  const evaluation = await evaluateMCQAttemptService(id, selectedOptions);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Attempt evaluated successfully",
    evaluation
  );
});

export const likeMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const requestId = req.locals?.requestId || "INTERNAL";

  const question = await MCQQuestion.findById(id);
  if (question?.likes.includes(userId)) {
    return next(new ErrorHandler("You already liked this question", HTTP_STATUS.BAD_REQUEST));
  }

  const data = await likeQuestionService(id, userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Question liked successfully",
    data
  );
});

export const dislikeMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const requestId = req.locals?.requestId || "INTERNAL";

  const question = await MCQQuestion.findById(id);
  if (question?.dislikes.includes(userId)) {
    return next(new ErrorHandler("You already disliked this question", HTTP_STATUS.BAD_REQUEST));
  }

  const data = await dislikeQuestionService(id, userId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Question disliked successfully",
    data
  );
});

export const reportMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;
  const requestId = req.locals?.requestId || "INTERNAL";

  if (!reason || reason.trim() === "") {
    return next(new ErrorHandler("Reason is required", HTTP_STATUS.BAD_REQUEST));
  }

  const question = await MCQQuestion.findById(id).select("reports");
  const alreadyReported = question?.reports.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (alreadyReported) {
    return next(new ErrorHandler("You already reported this question", HTTP_STATUS.BAD_REQUEST));
  }

  await reportQuestionService(id, userId, reason, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Report submitted successfully"
  );
});

export const getMCQAnalytics = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const analytics = await getMCQAnalyticsService(id);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Analytics fetched successfully",
    analytics
  );
});

