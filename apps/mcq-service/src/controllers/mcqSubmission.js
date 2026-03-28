import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQSubmission from "../models/mcqSubmissionModal.js";

import MCQPaper from "../models/mcqPaperModel.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";

export const createMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const {
    labId,
    labSectionId,
    chapterId,
    paperId,
    answers,
    mode = "course",
  } = req.body;
  const userId = req.user?._id;

  if (!labId) return next(new ErrorHandler("labId is required", 400));
  if (!Array.isArray(answers) || answers.length === 0)
    return next(new ErrorHandler("Answers are required", 400));
  if (!paperId) return next(new ErrorHandler("paperId is required", 400));

  const paper = await MCQPaper.findById(paperId);
  if (!paper || paper.isDeleted || !paper.isActive)
    return next(new ErrorHandler("MCQ Paper not found or inactive", 404));
  const pastAttemts = await MCQSubmission.countDocuments({
    userId,
    paperId,
    isDeleted: false,
    isFinal: true,
  });
  if (pastAttemts >= paper.maxAttempts)
    return next(
      new ErrorHandler("Maximum attempts reached for this paper", 400),
    );
  const attemptNumber = pastAttemts + 1;

  let totalQuestions = answers.length;
  let correctAnswers = 0;
  let totalScore = 0;

  const evaluatedAnswers = await Promise.all(
    answers.map(async (ans) => {
      const question = await MCQQuestion.findById(ans.questionId).lean();
      if (!question) return null;

      const correctOptionIndexes = question.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);

      const selectedIndexes = ans.selectedOptions || [];
      const isCorrect =
        correctOptionIndexes.length === selectedIndexes.length &&
        correctOptionIndexes.every((idx) => selectedIndexes.includes(idx));

      const marksAwarded = isCorrect ? question.marks : 0;
      if (isCorrect) correctAnswers += 1;
      totalScore += marksAwarded;

      return {
        questionId: ans.questionId,
        selectedOptions: selectedIndexes,
        isCorrect,
        marksAwarded,
        timeTaken: ans.timeTaken || 0,
      };
    }),
  );

  const finalAnswers = evaluatedAnswers.filter((a) => a !== null);

  const submission = await MCQSubmission.create({
    userId,
    labId,
    labSectionId,
    chapterId,
    paperId,
    mode,
    answers: finalAnswers,
    totalQuestions,
    correctAnswers,
    wrongAnswers: totalQuestions - correctAnswers,
    totalScore,
    isFinal: mode !== "practice",
    attemptNumber,
  });

  const cacheKey = `mcqSubmission:${userId}:${labId}:${labSectionId || "all"}:${
    chapterId || "all"
  }:${paperId || "all"}`;
  await redis.del(cacheKey);
  // Get best score so far for this user and paper
  const bestScoreDoc = await MCQSubmission.findOne({
    userId,
    paperId,
    isDeleted: false,
  })
    .sort({ totalScore: -1 })
    .lean();

  const bestScore = bestScoreDoc ? bestScoreDoc.totalScore : 0;

  res.status(201).json({
    success: true,
    message: "MCQ submission created",
    submission,
    attemptInfo: {
      currentAttempt: attemptNumber,
      maxAttempts: paper.maxAttempts,
      remainingAttempts: paper.maxAttempts - attemptNumber,
      bestScore,
    },
  });
});

export const getMyMCQSubmissions = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;

  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const cacheKey = `mcqSubmission:list:${userId}:${page}:${limit}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      submissions: cached,
      cached: true,
    });
  }

  const submissions = await MCQSubmission.find({ userId, isDeleted: false })
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  await redis.set(cacheKey, submissions, { ex: 10 * 60 });

  res.status(200).json({
    success: true,
    submissions,
    cached: false,
  });
});

export const getMCQSubmissionById = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { id } = req.params;

  const cacheKey = `mcqSubmission:detail:${userId}:${id}`;
  const cached = await redis.get(cacheKey);
  if (false) {
    return res.status(200).json({
      success: true,
      submission: cached,
      cached: true,
    });
  }

  const submission = await MCQSubmission.findOne({
    _id: id,
    userId,
    isDeleted: false,
  }).lean();
  if (!submission) return next(new ErrorHandler("Submission not found", 404));

  // For each answer, fetch the question to get correct options
  const detailedAnswers = await Promise.all(
    submission.answers.map(async (ans) => {
      const question = await MCQQuestion.findById(ans.questionId).lean();
      if (!question) return null;

      return {
        questionId: ans.questionId,
        selectedOptions: ans.selectedOptions,
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        timeTaken: ans.timeTaken,
        correctOptions: question.options
          .map((opt, idx) => (opt.isCorrect ? idx : -1))
          .filter((idx) => idx !== -1),
        questionTitle: question.title,
        questionDescription: question.description,
        options: question.options.map((opt) => opt.text),
      };
    }),
  );

  submission.answers = detailedAnswers.filter((a) => a !== null);

  // Get total attempts and max attempts
  const pastAttempts = await MCQSubmission.countDocuments({
    userId,
    paperId: submission.paperId,
    isDeleted: false,
  });
  const paper = await MCQPaper.findById(submission.paperId).lean();

  const attemptInfo = {
    currentAttempt: submission.attemptNumber,
    maxAttempts: paper?.maxAttempts ?? null,
    remainingAttempts:
      paper?.maxAttempts != null ? paper.maxAttempts - pastAttempts : null,
  };

  await redis.set(cacheKey, submission, { ex: 10 * 60 });

  res.status(200).json({
    success: true,
    submission,
    attemptInfo,
    cached: false,
  });
});

export const deleteMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { id } = req.params;

  const submission = await MCQSubmission.findOne({
    _id: id,
    userId,
    isDeleted: false,
  });
  if (!submission)
    return next(
      new ErrorHandler("Submission not found or already deleted", 404),
    );

  submission.isDeleted = true;
  await submission.save();

  const cacheKeyDetail = `mcqSubmission:detail:${userId}:${id}`;
  const cacheKeyListPattern = `mcqSubmission:list:${userId}:*`;
  await redis.del(cacheKeyDetail);
  await redis
    .keys(cacheKeyListPattern)
    .then((keys) => keys.forEach((key) => redis.del(key)));

  res.status(200).json({
    success: true,
    message: "Submission deleted successfully (soft delete)",
  });
});

export const evaluateMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const submission = await MCQSubmission.findById(id);
  if (!submission || submission.isDeleted)
    return next(new ErrorHandler("Submission not found", 404));

  if (submission.status === "evaluated")
    return next(new ErrorHandler("Submission already evaluated", 400));

  let totalScore = 0;
  let correctAnswers = 0;

  for (const ans of submission.answers) {
    const question = await MCQQuestion.findById(ans.questionId).lean();
    if (!question) continue;

    const correctOptionIndexes = question.options
      .map((opt, idx) => (opt.isCorrect ? idx : -1))
      .filter((idx) => idx !== -1);

    const selectedIndexes = ans.selectedOptions || [];
    const isCorrect =
      correctOptionIndexes.length === selectedIndexes.length &&
      correctOptionIndexes.every((idx) => selectedIndexes.includes(idx));

    ans.isCorrect = isCorrect;
    ans.marksAwarded = isCorrect ? question.marks : 0;

    if (isCorrect) correctAnswers += 1;
    totalScore += ans.marksAwarded;
  }

  submission.correctAnswers = correctAnswers;
  submission.wrongAnswers = submission.totalQuestions - correctAnswers;
  submission.totalScore = totalScore;
  submission.status = "evaluated";
  submission.evaluatedAt = Date.now();

  await submission.save();

  const cacheKeyDetail = `mcqSubmission:detail:${submission.userId}:${id}`;
  await redis.del(cacheKeyDetail);

  res.status(200).json({
    success: true,
    message: "Submission evaluated successfully",
    submission,
  });
});

export const finalizeMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const submission = await MCQSubmission.findOne({
    _id: id,
    userId,
    isDeleted: false,
  });
  if (!submission) return next(new ErrorHandler("Submission not found", 404));

  if (submission.isFinal)
    return next(new ErrorHandler("Submission already finalized", 400));

  submission.isFinal = true;
  submission.status = "submitted";
  await submission.save();

  const cacheKeyDetail = `mcqSubmission:detail:${userId}:${id}`;
  const cacheKeyListPattern = `mcqSubmission:list:${userId}:*`;
  await redis.del(cacheKeyDetail);
  await redis
    .keys(cacheKeyListPattern)
    .then((keys) => keys.forEach((key) => redis.del(key)));

  res.status(200).json({
    success: true,
    message: "Submission finalized successfully",
    submission,
  });
});

export const reviewMCQSubmission = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const cacheKey = `mcqSubmission:review:${userId}:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      review: cached,
      cached: true,
    });
  }

  const submission = await MCQSubmission.findOne({
    _id: id,
    userId,
    isDeleted: false,
  }).lean();
  if (!submission) return next(new ErrorHandler("Submission not found", 404));

  const review = await Promise.all(
    (submission.answers || []).map(async (ans) => {
      const question = await MCQQuestion.findById(ans.questionId).lean();
      if (!question) return null;

      return {
        questionId: ans.questionId,
        title: question.title,
        description: question.description,
        selectedOptions: ans.selectedOptions,
        correctOptions: question.options
          .map((opt, idx) => (opt.isCorrect ? idx : -1))
          .filter((idx) => idx !== -1),
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        explanation: question.explanation || null,
        options: question.options.map((opt) => ({ text: opt.text })),
      };
    }),
  );

  const filteredReview = review.filter((r) => r !== null);

  await redis.set(cacheKey, filteredReview, { ex: 10 * 60 });

  res.status(200).json({
    success: true,
    review: filteredReview,
    cached: false,
  });
});

export const getUserMCQStats = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const cacheKey = `mcqStats:user:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, stats: cached, cached: true });
  }

  const submissions = await MCQSubmission.find({
    userId,
    isDeleted: false,
  }).lean();

  const totalSubmissions = submissions.length;
  const totalQuestions = submissions.reduce(
    (sum, sub) => sum + sub.totalQuestions,
    0,
  );
  const correctAnswers = submissions.reduce(
    (sum, sub) => sum + sub.correctAnswers,
    0,
  );
  const wrongAnswers = submissions.reduce(
    (sum, sub) => sum + sub.wrongAnswers,
    0,
  );
  const totalScore = submissions.reduce((sum, sub) => sum + sub.totalScore, 0);

  const stats = {
    totalSubmissions,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    totalScore,
  };

  await redis.set(cacheKey, stats, { ex: 10 * 60 });

  res.status(200).json({
    message: "MCQ Stats Fetched !!",
    success: true,
    stats,
    cached: false,
  });
});

export const getLabMCQStats = CatchAsyncError(async (req, res, next) => {
  const { labId } = req.params;
  const cacheKey = `mcqStats:lab:${labId}`;

  const cached = await redis.get(cacheKey);
  if (cached)
    return res.status(200).json({ success: true, stats: cached, cached: true });

  const submissions = await MCQSubmission.find({
    labId,
    isDeleted: false,
  }).lean();

  const totalSubmissions = submissions.length;
  const totalQuestions = submissions.reduce(
    (sum, sub) => sum + sub.totalQuestions,
    0,
  );
  const correctAnswers = submissions.reduce(
    (sum, sub) => sum + sub.correctAnswers,
    0,
  );
  const wrongAnswers = submissions.reduce(
    (sum, sub) => sum + sub.wrongAnswers,
    0,
  );
  const totalScore = submissions.reduce((sum, sub) => sum + sub.totalScore, 0);

  const stats = {
    totalSubmissions,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    totalScore,
  };

  await redis.set(cacheKey, stats, { ex: 10 * 60 });

  res.status(200).json({ success: true, stats, cached: false });
});

export const getQuestionMCQStats = CatchAsyncError(async (req, res, next) => {
  const { questionId } = req.params;
  const cacheKey = `mcqStats:question:${questionId}`;

  const cached = await redis.get(cacheKey);
  if (cached)
    return res.status(200).json({ success: true, stats: cached, cached: true });

  const submissions = await MCQSubmission.find({
    "answers.questionId": questionId,
    isDeleted: false,
  }).lean();

  let totalAttempts = 0;
  let correctAttempts = 0;
  let wrongAttempts = 0;

  submissions.forEach((sub) => {
    const ans = sub.answers.find((a) => a.questionId.toString() === questionId);
    if (ans) {
      totalAttempts += 1;
      if (ans.isCorrect) correctAttempts += 1;
      else wrongAttempts += 1;
    }
  });

  const stats = {
    totalAttempts,
    correctAttempts,
    wrongAttempts,
    accuracy: totalAttempts ? (correctAttempts / totalAttempts) * 100 : 0,
  };

  await redis.set(cacheKey, stats, { ex: 10 * 60 });

  res.status(200).json({ success: true, stats, cached: false });
});

export const getAllMCQSubmissions = CatchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;

  const submissions = await MCQSubmission.find({ isDeleted: false })
    .populate("userId", "name email")
    .populate("labId", "title")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ submittedAt: -1 })
    .lean();

  const total = await MCQSubmission.countDocuments({ isDeleted: false });

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    submissions,
  });
});

export const hardDeleteMCQSubmission = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;

    const submission = await MCQSubmission.findByIdAndDelete(id);
    if (!submission) return next(new ErrorHandler("Submission not found", 404));

    const keys = [
      `mcqStats:user:${submission.userId}`,
      `mcqStats:lab:${submission.labId}`,
    ];
    submission.answers.forEach((ans) =>
      keys.push(`mcqStats:question:${ans.questionId}`),
    );
    await redis.del(...keys);

    res.status(200).json({
      success: true,
      message: "Submission hard deleted",
    });
  },
);

export const updateMCQSubmissionStatus = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["in-progress", "submitted", "evaluated"].includes(status))
      return next(new ErrorHandler("Invalid status value", 400));

    const submission = await MCQSubmission.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!submission) return next(new ErrorHandler("Submission not found", 404));

    const keys = [
      `mcqStats:user:${submission.userId}`,
      `mcqStats:lab:${submission.labId}`,
    ];
    submission.answers.forEach((ans) =>
      keys.push(`mcqStats:question:${ans.questionId}`),
    );
    await redis.del(...keys);

    res.status(200).json({
      success: true,
      message: "Submission status updated",
      submission,
    });
  },
);
