import mongoose from "mongoose";
import MCQPaper from "../models/mcqPaperModel.js";
import MCQQuestion from "../models/mcqQuestionModal.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { findOrCreatePaper } from "../validation/findOrCreatePaper.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

export const createQuestionService = async (data, userId, requestId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let paperId = data.paperId || null;

    const [mcq] = await MCQQuestion.create(
      [
        {
          ...data,
          author: userId,
          paperId: paperId, 
        },
      ],
      { session },
    );

    if (paperId) {
      const updatedPaper = await MCQPaper.findByIdAndUpdate(
        paperId,
        { $addToSet: { questionIds: mcq._id } },
        { session, new: true },
      );

      if (!updatedPaper) {
        throw new Error(`Paper with ID ${paperId} not found.`);
      }

      logger.info(
        `[${requestId}] Service: Question successfully linked to Paper ${paperId}`,
      );
    } else {
      logger.info(`[${requestId}] Service: Question created without linking to any Paper.`);
    }

    await session.commitTransaction();
    return mcq;

  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Transaction aborted. Error: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateQuestionService = async (id, data, requestId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const mcq = await MCQQuestion.findById(id).session(session);
    if (!mcq)
      throw new ErrorHandler(
        "Question not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );

    const oldPaperId = mcq.paperId;
    const newPaperId = data.paperId;

    Object.assign(mcq, data);
    await mcq.save({ session });

    if (newPaperId && String(oldPaperId) !== String(newPaperId)) {
      // Remove from old paper
      if (oldPaperId) {
        await MCQPaper.findByIdAndUpdate(
          oldPaperId,
          { $pull: { questionIds: mcq._id } },
          { session },
        );
      }
      await MCQPaper.findByIdAndUpdate(
        newPaperId,
        { $addToSet: { questionIds: mcq._id } },
        { session },
      );
    }

    await session.commitTransaction();
    logger.info(`[${requestId}] Service: Question ${id} updated and synced.`);
    return mcq;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteQuestionService = async (id, requestId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const mcq = await MCQQuestion.findById(id).session(session);
    if (!mcq)
      throw new ErrorHandler("MCQ Question not found", HTTP_STATUS.NOT_FOUND);
    if (mcq.isDeleted)
      throw new ErrorHandler(
        "MCQ Question already deleted",
        HTTP_STATUS.BAD_REQUEST,
      );

    mcq.isDeleted = true;
    await mcq.save({ session });

    if (mcq.paperId) {
      await MCQPaper.findByIdAndUpdate(
        mcq.paperId,
        { $pull: { questionIds: mcq._id } },
        { session },
      );
    }

    await session.commitTransaction();

    logger.info(
      `[${requestId}] Service: Question ${id} soft-deleted and synced.`,
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateStatusService = async (id, status, requestId) => {
  const mcq = await MCQQuestion.findById(id);
  if (!mcq)
    throw new ErrorHandler("MCQ Question not found", HTTP_STATUS.NOT_FOUND);

  mcq.status = status;
  await mcq.save();

  logger.info(
    `[${requestId}] Service: Status updated to ${status} for MCQ ${id}`,
  );
  return mcq;
};

export const updateAccessLevelService = async (id, accessLevel, requestId) => {
  const mcq = await MCQQuestion.findById(id);
  if (!mcq) throw new ErrorHandler("MCQ Question not found", HTTP_STATUS.NOT_FOUND);

  mcq.accessLevel = accessLevel;
  await mcq.save();
  
  logger.info(`[${requestId}] Service: Access level updated to ${accessLevel} for MCQ ${id}`);
  return mcq;
};

export const getQuestionByIdService = async (id) => {
  const mcq = await MCQQuestion.findById(id).lean();

  if (!mcq || mcq.isDeleted) {
    throw new ErrorHandler("MCQ Question not found", HTTP_STATUS.NOT_FOUND);
  }

  if (mcq.status !== "published") {
    throw new ErrorHandler("This MCQ is not available", HTTP_STATUS.FORBIDDEN);
  }

  return mcq;
};

export const getAllMCQQuestionsService = async (filters) => {
  const { chapterId, paperId, difficulty, tags, page = 1, limit = 10 } = filters;

  const query = { isDeleted: false, status: "published" };

  if (chapterId) query.chapterId = chapterId;
  if (paperId) query.paperId = paperId;
  if (difficulty) query.difficulty = difficulty.toLowerCase();
  if (tags) {
    query.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()) };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [mcqs, total] = await Promise.all([
    MCQQuestion.find(query)
      .skip(skip)
      .limit(Number(limit))
      .lean()
      .sort({ createdAt: -1 }),
    MCQQuestion.countDocuments(query),
  ]);

  return { mcqs, total, page: Number(page), limit: Number(limit) };
};

export const getRandomMCQsService = async (filters, requestId) => {
  const { count = 5, difficulty, tags } = filters;
  
  const matchStage = {
    isDeleted: false,
    isActive: true,
    status: "published",
  };

  if (difficulty) matchStage.difficulty = difficulty;
  if (tags) matchStage.tags = { $in: tags.split(",") };

  const mcqs = await MCQQuestion.aggregate([
    { $match: matchStage },
    { $sample: { size: parseInt(count, 10) } },
    {
      $project: {
        title: 1, description: 1, difficulty: 1, tags: 1,
        options: 1, multipleCorrect: 1, marks: 1, negativeMarks: 1
      },
    },
  ]);

  if (!mcqs || mcqs.length === 0) {
    throw new ErrorHandler("No MCQs found matching criteria", HTTP_STATUS.NOT_FOUND);
  }
  
  logger.info(`[${requestId}] Service: Random MCQs fetched from DB.`);
  return mcqs;
};

export const evaluateMCQAttemptService = async (id, selectedOptions) => {
  const question = await MCQQuestion.findOne({
    _id: id,
    status: "published",
    isActive: true,
    isDeleted: false,
  }).lean();

  if (!question) {
    throw new ErrorHandler("Question not found or not accessible", HTTP_STATUS.NOT_FOUND);
  }

  const correctOptions = question.options
    .map((opt, idx) => (opt.isCorrect ? idx : null))
    .filter((val) => val !== null);

  let isCorrect = false;
  if (question.multipleCorrect) {
    isCorrect =
      selectedOptions.length === correctOptions.length &&
      selectedOptions.every((opt) => correctOptions.includes(opt));
  } else {
    isCorrect =
      selectedOptions.length === 1 &&
      correctOptions.includes(selectedOptions[0]);
  }

  const earnedMarks = isCorrect ? question.marks : (question.negativeMarks > 0 ? -question.negativeMarks : 0);

  const correctOptionData = question.options.find(opt => opt.isCorrect);

  return {
    questionId: id,
    isCorrect,
    earnedMarks,
    correctOptions,
    explanation: correctOptionData?.explanation || "No explanation provided"
  };
};

export const likeQuestionService = async (id, userId, requestId) => {
  const question = await MCQQuestion.findByIdAndUpdate(
    id,
    {
      $addToSet: { likes: userId },
      $pull: { dislikes: userId },
    },
    { new: true } 
  );

  if (!question || question.isDeleted) {
    throw new ErrorHandler("Question not found or is deleted", HTTP_STATUS.NOT_FOUND);
  }
  
  logger.info(`[${requestId}] Service: Question ${id} liked by user ${userId}`);
  return { likesCount: question.likes.length };
};

export const dislikeQuestionService = async (id, userId, requestId) => {

  const question = await MCQQuestion.findByIdAndUpdate(
    id,
    {
      $addToSet: { dislikes: userId },
      $pull: { likes: userId },
    },
    { new: true }
  );

  if (!question || question.isDeleted) {
    throw new ErrorHandler("Question not found or is deleted", HTTP_STATUS.NOT_FOUND);
  }
  
  logger.info(`[${requestId}] Service: Question ${id} disliked by user ${userId}`);
  return { dislikesCount: question.dislikes.length };
};

export const reportQuestionService = async (id, userId, reason, requestId) => {

  const question = await MCQQuestion.findByIdAndUpdate(
    id,
    {
      $push: {
        reports: {
          user: userId,
          reason,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!question || question.isDeleted) {
    throw new ErrorHandler("Question not found", HTTP_STATUS.NOT_FOUND);
  }

  logger.info(`[${requestId}] Service: Question ${id} reported by user ${userId}`);
  return true;
};

export const getMCQAnalyticsService = async (id) => {

  const question = await MCQQuestion.findById(id)
    .select("likes dislikes reports")
    .lean();

  if (!question || question.isDeleted) {
    throw new ErrorHandler("Question not found", HTTP_STATUS.NOT_FOUND);
  }

  const analytics = {
    likes: question.likes.length,
    dislikes: question.dislikes.length,
    reports: question.reports.length,
  };


  return analytics;
};