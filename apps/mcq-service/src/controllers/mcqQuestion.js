import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQPaper from "../models/mcqPaperModel.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { validateMCQPayload } from "../../../../packages/common/src/utils/mcqValidator.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import {
  sanitizeObject,
  sanitizeString,
} from "../../../../packages/common/src/utils/sanitizeInput.js";

export const createMCQQuestion = CatchAsyncError(async (req, res, next) => {

  const {
    sanitizedBody,
    tags,
    options,
    multipleCorrect,
    marks,
    negativeMarks,
    labId,
    labSectionId,
    referenceLinks,
    customFields,
  } = validateMCQPayload(req.body);

  const { chapterId, paperId } = req.body;

  let resolvedPaperId = paperId;
  if (!resolvedPaperId) {
    if (!chapterId) {
      return next(
        new ErrorHandler(
          "chapterId is required when paperId is not provided",
          400,
        ),
      );
    }

    const paperQuery = { labId, chapterId, isDeleted: false };
    if (labSectionId) paperQuery.labSectionId = labSectionId;

    let paper = await MCQPaper.findOne({ ...paperQuery, status: "draft" });
    if (!paper) paper = await MCQPaper.findOne(paperQuery);

    if (!paper) {
      paper = await MCQPaper.create({
        title: "MCQ Paper - Chapter",
        description: "",
        labId,
        labSectionId,
        chapterId,
        questionIds: [],
        durationMinutes: 0,
        status: "draft",
        createdBy: req.user?._id,
      });
    }
    resolvedPaperId = paper._id;
  }

  const mcq = await MCQQuestion.create({
    title: sanitizedBody.title,
    description: sanitizedBody.description,
    difficulty: sanitizedBody.difficulty.toLowerCase(),
    tags: Array.isArray(tags) ? tags.map((t) => sanitizeString(t)) : [],
    options: options.map((opt) => ({
      text: sanitizeObject(opt, { text: "string" }).text,
      isCorrect: !!opt.isCorrect,
    })),
    multipleCorrect,
    marks: Number(marks),
    negativeMarks: negativeMarks ? Number(negativeMarks) : 0,
    labId,
    labSectionId,
    chapterId: chapterId || undefined,
    paperId: resolvedPaperId || undefined,
    accessLevel: sanitizedBody.accessLevel.toLowerCase(),
    // status: sanitizedBody.status?.toLowerCase(),
    author: req.user?._id,
    explanation: sanitizedBody.explanation,
    referenceLinks,
    customFields,
  });

  // If question is assigned to a paper, ensure paper has this questionId
  if (resolvedPaperId) {
    await MCQPaper.findByIdAndUpdate(
      resolvedPaperId,
      { $addToSet: { questionIds: mcq._id } },
      { new: true },
    );
  }

  await redis.del("mcqQuestions");

  res.status(201).json({
    success: true,
    message: "MCQ Question created !!",
    mcq,
  });
});

export const updateMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const schema = {
    title: "string",
    description: "string",
    difficulty: "string",
    accessLevel: "string",
    explanation: "string",
  };

  const sanitizedBody = sanitizeObject(req.body, schema);

  const {
    tags,
    options,
    multipleCorrect,
    marks,
    negativeMarks,
    labId,
    labSectionId,
    chapterId,
    paperId,
    referenceLinks,
    customFields,
  } = req.body;

  const validationError = validateMCQData(
    {
      ...sanitizedBody,
      options,
      multipleCorrect,
      marks,
      negativeMarks,
      labId,
      labSectionId,
      referenceLinks,
    },
    true,
  );
  if (validationError) {
    return next(new ErrorHandler(validationError, 400));
  }

  let mcq = await MCQQuestion.findById(id);
  if (!mcq) {
    return next(new ErrorHandler("MCQ Question not found", 404));
  }

  mcq.title = sanitizedBody.title ?? mcq.title;
  mcq.description = sanitizedBody.description ?? mcq.description;
  mcq.difficulty = sanitizedBody.difficulty?.toLowerCase() ?? mcq.difficulty;
  mcq.accessLevel = sanitizedBody.accessLevel?.toLowerCase() ?? mcq.accessLevel;
  mcq.explanation = sanitizedBody.explanation ?? mcq.explanation;

  if (Array.isArray(tags)) {
    mcq.tags = tags.map((t) => sanitizeString(t));
  }

  if (Array.isArray(options)) {
    mcq.options = options.map((opt) => ({
      text: sanitizeObject(opt, { text: "string" }).text,
      isCorrect: !!opt.isCorrect,
    }));
  }

  if (typeof multipleCorrect === "boolean")
    mcq.multipleCorrect = multipleCorrect;
  if (marks !== undefined) mcq.marks = Number(marks);
  if (negativeMarks !== undefined) mcq.negativeMarks = Number(negativeMarks);
  if (labId) mcq.labId = labId;
  if (labSectionId) mcq.labSectionId = labSectionId;
  if (chapterId !== undefined) mcq.chapterId = chapterId;
  if (paperId !== undefined) mcq.paperId = paperId;
  if (referenceLinks) mcq.referenceLinks = referenceLinks;
  if (customFields) mcq.customFields = customFields;

  await mcq.save();

  // Invalidate redis cache
  await redis.del("mcqQuestions");

  res.status(200).json({
    success: true,
    message: "MCQ Question updated successfully",
    mcq,
  });
});

export const deleteMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  let mcq = await MCQQuestion.findById(id);
  if (!mcq) {
    return next(new ErrorHandler("MCQ Question not found", 404));
  }

  if (mcq.isDeleted) {
    return next(new ErrorHandler("MCQ Question already deleted", 400));
  }

  mcq.isDeleted = true;
  await mcq.save();

  await redis.del("mcqQuestions");

  res.status(200).json({
    success: true,
    message: "MCQ Question deleted !!",
  });
});

export const changeMCQStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(status, "ss");

  const allowedStatuses = ["draft", "published", "archived"];
  if (!status || !allowedStatuses.includes(status.toLowerCase())) {
    return next(
      new ErrorHandler(
        "Invalid status. Allowed values: draft, published, archived",
        400,
      ),
    );
  }

  let mcq = await MCQQuestion.findById(id);
  if (!mcq) {
    return next(new ErrorHandler("MCQ Question not found", 404));
  }

  mcq.status = status.toLowerCase();
  console.log(mcq.status, "ms");

  await mcq.save();

  await redis.del("mcqQuestions");

  res.status(200).json({
    success: true,
    message: `MCQ Question status updated to '${mcq.status}'`,
    mcq,
  });
});

export const changeMCQAccessLevel = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { accessLevel } = req.body;

  const allowedAccessLevels = ["free", "standard", "premium"];
  if (
    !accessLevel ||
    !allowedAccessLevels.includes(accessLevel.toLowerCase())
  ) {
    return next(
      new ErrorHandler(
        "Invalid accessLevel. Allowed values: free, standard, premium",
        400,
      ),
    );
  }

  let mcq = await MCQQuestion.findById(id);
  if (!mcq) {
    return next(new ErrorHandler("MCQ Question not found", 404));
  }

  mcq.accessLevel = accessLevel.toLowerCase();
  await mcq.save();

  await redis.del("mcqQuestions");

  res.status(200).json({
    success: true,
    message: `MCQ Question accessLevel updated to '${mcq.accessLevel}'`,
    mcq,
  });
});

export const getMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const mcq = await MCQQuestion.findById(id).lean();
  if (!mcq || mcq.isDeleted) {
    return next(new ErrorHandler("MCQ Question not found", 404));
  }

  if (mcq.status !== "published") {
    return next(new ErrorHandler("This MCQ is not available", 403));
  }

  res.status(200).json({
    success: true,
    mcq,
  });
});

export const getAllMCQQuestions = CatchAsyncError(async (req, res, next) => {
  const {
    labId,
    labSectionId,
    chapterId,
    paperId,
    difficulty,
    tags,
    page = 1,
    limit = 10,
  } = req.query;

  const query = { isDeleted: false, status: "published" };

  if (labId) query.labId = labId;
  if (labSectionId) query.labSectionId = labSectionId;
  if (chapterId) query.chapterId = chapterId;
  if (paperId) query.paperId = paperId;
  if (difficulty) query.difficulty = difficulty.toLowerCase();
  if (tags)
    query.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()) };

  const skip = (Number(page) - 1) * Number(limit);
  console.log("Querying MCQs with:", query);
  const [mcqs, total] = await Promise.all([
    MCQQuestion.find(query)
      .skip(skip)
      .limit(Number(limit))
      .lean()
      .sort({ createdAt: -1 }),
    MCQQuestion.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    mcqs,
  });
});

export const getRandomMCQs = CatchAsyncError(async (req, res, next) => {
  const { count = 5, difficulty, labId, tags } = req.query;

  const matchStage = {
    isDeleted: false,
    isActive: true,
    status: "published",
  };

  if (difficulty) matchStage.difficulty = difficulty;
  if (labId) matchStage.labId = labId;
  if (tags) matchStage.tags = { $in: tags.split(",") };

  const cacheKey = `mcq:random:${JSON.stringify(matchStage)}:${count}`;

  const cachedData = await redis.get(cacheKey);
  if (false) {
    return res.status(200).json({
      success: true,
      message: "Random MCQs fetched successfully (from cache)",
      data: cachedData,
    });
  }

  const mcqs = await MCQQuestion.aggregate([
    { $match: matchStage },
    { $sample: { size: parseInt(count, 10) } },
    {
      $project: {
        title: 1,
        description: 1,
        difficulty: 1,
        tags: 1,
        options: 1,
        multipleCorrect: 1,
        marks: 1,
        negativeMarks: 1,
        labId: 1,
        labSectionId: 1,
      },
    },
  ]);

  if (!mcqs || mcqs.length === 0) {
    return next(new ErrorHandler("No MCQs found matching criteria", 404));
  }

  await redis.setex(cacheKey, 300, mcqs);

  res.status(200).json({
    success: true,
    message: "Random MCQs fetched !!",
    count: mcqs.length,
    data: mcqs,
  });
});

export const attemptMCQQuestion = CatchAsyncError(async (req, res, next) => {
  console.log(req.body, "aa");

  const { id } = req.params;
  const { selectedOptions } = req.body;
  const userId = req.user?._id;

  if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
    return next(new ErrorHandler("Selected options are required", 400));
  }

  const question = await MCQQuestion.findOne({
    _id: id,
    status: "published",
    isActive: true,
    isDeleted: false,
  });

  if (!question) {
    return next(new ErrorHandler("Question not found or not accessible", 404));
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

  let earnedMarks = 0;
  if (isCorrect) {
    earnedMarks = question.marks;
  } else if (question.negativeMarks > 0) {
    earnedMarks = -question.negativeMarks;
  }

  return res.status(200).json({
    success: true,
    message: "Attempt evaluated successfully",
    data: {
      questionId: id,
      isCorrect,
      earnedMarks,
      correctOptions,
      explanation: question.explanation,
    },
  });
});

export const likeMCQQuestion = CatchAsyncError(async (req, res, next) => {
  console.log("User ID:", req.user?._id);

  const { id } = req.params;
  const userId = req.user._id;

  const question = await MCQQuestion.findById(id);
  if (!question || question.isDeleted) {
    return next(new ErrorHandler("Question not found", 404));
  }

  if (question.likes.includes(userId)) {
    console.log("User has already liked this question");
    return next(new ErrorHandler("You already liked this question", 400));
  }

  question.dislikes = question.dislikes.filter(
    (uid) => uid.toString() !== userId.toString(),
  );

  question.likes.push(userId);
  await question.save();

  await redis.del(`mcq:${id}`);

  res.status(200).json({
    success: true,
    message: "Question liked successfully",
    likes: question.likes.length,
  });
});

export const dislikeMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  const question = await MCQQuestion.findById(id);
  if (!question || question.isDeleted) {
    return next(new ErrorHandler("Question not found", 404));
  }

  if (question.dislikes.includes(userId)) {
    return next(new ErrorHandler("You already disliked this question", 400));
  }

  question.likes = question.likes.filter(
    (uid) => uid.toString() !== userId.toString(),
  );

  question.dislikes.push(userId);
  await question.save();

  await redis.del(`mcq:${id}`);

  res.status(200).json({
    success: true,
    message: "Question disliked successfully",
    dislikes: question.dislikes.length,
  });
});

export const reportMCQQuestion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason || reason.trim() === "") {
    return next(new ErrorHandler("Reason is required", 400));
  }

  const question = await MCQQuestion.findById(id);
  if (!question || question.isDeleted) {
    return next(new ErrorHandler("Question not found", 404));
  }

  const alreadyReported = question.reports.find(
    (r) => r.user.toString() === userId.toString(),
  );
  if (alreadyReported) {
    return next(new ErrorHandler("You already reported this question", 400));
  }

  question.reports.push({
    user: userId,
    reason,
    createdAt: new Date(),
  });
  await question.save();

  await redis.del(`mcq:${id}`);

  res.status(200).json({
    success: true,
    message: "Report submitted successfully",
  });
});

export const getMCQAnalytics = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const cacheKey = `mcq:${id}:analytics`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Fetched from cache",
      data: cached,
    });
  }

  const question = await MCQQuestion.findById(id).select(
    "likes dislikes reports",
  );

  if (!question || question.isDeleted) {
    return next(new ErrorHandler("Question not found", 404));
  }

  const analytics = {
    likes: question.likes.length,
    dislikes: question.dislikes.length,
    reports: question.reports.length,
  };

  await redis.set(cacheKey, analytics, { ex: 300 });

  res.status(200).json({
    success: true,
    message: "Analytics fetched successfully",
    data: analytics,
  });
});
