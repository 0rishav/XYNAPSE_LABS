import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import MCQPaper from "../models/mcqPaperModel.js";
import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQSubmission from "../models/mcqSubmissionModal.js";
import fs from "fs";

export const createMCQPaper = CatchAsyncError(async (req, res, next) => {
  const {
    title,
    description,
    labId,
    labSectionId,
    chapterId,
    questionIds = [],
    durationMinutes = 0,
    status = "draft",
    availability = "active",
    maxAttempts = 1,
  } = req.body;

  if (maxAttempts < 1)
    return next(new ErrorHandler("maxAttempts must be at least 1", 400));

  if (!title) return next(new ErrorHandler("title is required", 400));
  if (!labId) return next(new ErrorHandler("labId is required", 400));
  if (!chapterId) return next(new ErrorHandler("chapterId is required", 400));
  if (maxAttempts < 1)
    return next(new ErrorHandler("maxAttempts must be at least 1", 400));

  let uploadedThumb;
  try {
    if (req.file) {
      uploadedThumb = await cloudinary.uploader.upload(req.file.path, {
        folder: "mcq_papers",
      });
    }

    const paper = await MCQPaper.create({
      title,
      description,
      labId,
      labSectionId,
      chapterId,
      questionIds,
      durationMinutes,
      status: String(status).toLowerCase(),
      availability: String(availability).toLowerCase(),
      maxAttempts,
      thumbnail: uploadedThumb
        ? { url: uploadedThumb.secure_url, public_id: uploadedThumb.public_id }
        : undefined,
      createdBy: req.user?._id,
    });
    // console.log("maxAttempts in created paper:", paper.maxAttempts);

    await redis.del(`mcqPaper:list:${chapterId}`);

    res
      .status(201)
      .json({ success: true, message: "MCQ Paper created", paper });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

export const updateMCQPaper = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body || {};

  const paper = await MCQPaper.findById(id);
  if (!paper || paper.isDeleted)
    return next(new ErrorHandler("Paper not found", 404));

  const allowed = [
    "title",
    "description",
    "labId",
    "labSectionId",
    "chapterId",
    "questionIds",
    "durationMinutes",
    "totalMarks",
    "status",
    "maxAttempts",
    "isActive",
    "availability",
    "visibility",
  ];
  for (const k of allowed) if (updates[k] !== undefined) paper[k] = updates[k];

  let newUpload;
  try {
    if (req.file) {
      newUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: "mcq_papers",
      });
      // delete previous image if exists
      if (paper.thumbnail?.public_id) {
        try {
          await cloudinary.uploader.destroy(paper.thumbnail.public_id);
        } catch {}
      }
      paper.thumbnail = {
        url: newUpload.secure_url,
        public_id: newUpload.public_id,
      };
    }
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }

  paper.updatedBy = req.user?._id;
  await paper.save();

  await redis.del(`mcqPaper:list:${paper.chapterId}`);

  res.status(200).json({ success: true, message: "MCQ Paper updated", paper });
});

export const deleteMCQPaper = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const paper = await MCQPaper.findById(id);
  if (!paper || paper.isDeleted)
    return next(new ErrorHandler("Paper not found", 404));
  paper.isDeleted = true;
  await paper.save();

  await redis.del(`mcqPaper:list:${paper.chapterId}`);
  res.status(200).json({ success: true, message: "MCQ Paper deleted" });
});

export const getMCQPaper = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const paper = await MCQPaper.findById(id)
    .populate({ path: "chapterId", select: "title" })
    .lean();
  if (!paper || paper.isDeleted)
    return next(new ErrorHandler("Paper not found", 404));
  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";
  if (!isAdmin) {
    if (paper.availability !== "active") {
      return next(new ErrorHandler("Paper not accessible", 403));
    }
    if (paper.status !== "published") {
      return next(new ErrorHandler("Paper not accessible", 403));
    }
    if (paper.visibility === "private") {
      const isPaidForLab = !!req.isPaidForLab;
      if (!isPaidForLab) {
        return next(
          new ErrorHandler("Payment required to access this paper", 402)
        );
      }
    } else if (paper.visibility === "restricted") {
      return next(new ErrorHandler("Paper is restricted", 403));
    }
  }
  res.status(200).json({ success: true, paper });
});

export const listMCQPapers = CatchAsyncError(async (req, res, next) => {
  const { labId, labSectionId, chapterId, status } = req.query;
  const userId = req.user?._id;

  const query = { isDeleted: false };
  if (labId) query.labId = labId;
  if (chapterId) query.chapterId = chapterId;
  if (status && String(status).toLowerCase() !== "any") {
    query.status = String(status).toLowerCase();
  }

  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";
  if (!isAdmin) {
    query.status = "published";
    const isPaidUser = !!req.isPaidUser;
    if (isPaidUser) {
      query.availability = { $in: ["active", "inactive"] };
    } else {
      query.availability = "active";
    }
  }

  const cacheKey = `mcqPaper:list:${chapterId || "all"}:${labId || "all"}:${
    labSectionId || "all"
  }:${status || "any"}:user:${userId}`;

  const cached = await redis.get(cacheKey);
  if (false) {
    return res
      .status(200)
      .json({ success: true, papers: cached, cached: true });
  }

  const papers = await MCQPaper.find(query)
    .populate({ path: "chapterId", select: "title" })
    .sort({ createdAt: -1 })
    .lean();

  const paperIds = papers.map((paper) => paper._id);

  const submissions = await MCQSubmission.aggregate([
    {
      $match: {
        userId,
        paperId: { $in: paperIds },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$paperId",
        count: { $sum: 1 },
      },
    },
  ]);

  const attemptMap = {};
  submissions.forEach((sub) => {
    attemptMap[sub._id.toString()] = sub.count;
  });

  const papersWithAttempts = papers.map((paper) => {
    const attemptCount = attemptMap[paper._id.toString()] || 0;
    const maxAttempts = paper.maxAttempts;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);
    const disabled = attemptCount >= maxAttempts;

    return {
      ...paper,
      attemptInfo: {
        currentAttempt: attemptCount,
        maxAttempts,
        remainingAttempts,
        disabled,
      },
    };
  });

  await redis.set(cacheKey, papersWithAttempts, { ex: 300 });

  res
    .status(200)
    .json({
      success: true,
      papers: papersWithAttempts,
      isPaidUser: !!req.isPaidUser,
      isPaidForLab: !!req.isPaidForLab,
      cached: false,
    });
});

export const getPaperQuestions = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const paper = await MCQPaper.findById(id)
    .populate({ path: "chapterId", select: "title" })
    .lean();
  if (!paper || paper.isDeleted)
    return next(new ErrorHandler("Paper not found", 404));

  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";
  if (!isAdmin) {
    if (paper.availability !== "active") {
      return next(new ErrorHandler("Paper not accessible", 403));
    }
    if (paper.status !== "published") {
      return next(new ErrorHandler("Paper not accessible", 403));
    }
    if (paper.visibility === "private") {
      const isPaidUser = !!req.isPaidUser;
      if (!isPaidUser) {
        return next(
          new ErrorHandler("Payment required to access this paper", 402)
        );
      }
    } else if (paper.visibility === "restricted") {
      return next(new ErrorHandler("Paper is restricted", 403));
    }
  }

  const { status } = req.query;
  const questionQuery = {
    _id: { $in: paper.questionIds },
    isDeleted: false,
  };
  if (status && status !== "any")
    questionQuery.status = String(status).toLowerCase();

  // Fetch and preserve the order defined in paper.questionIds
  const rawQuestions = await MCQQuestion.find(questionQuery).lean();

  const qMap = new Map(rawQuestions.map((q) => [String(q._id), q]));
  const questions = paper.questionIds
    .map((qid) => qMap.get(String(qid)))
    .filter(Boolean);

  res.status(200).json({ success: true, paper, questions });
});

export const addQuestionToPaper = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params; // paper id
  const { questionId } = req.body;
  if (!questionId) return next(new ErrorHandler("questionId is required", 400));

  const paper = await MCQPaper.findById(id);
  if (!paper || paper.isDeleted)
    return next(new ErrorHandler("Paper not found", 404));

  // Load question to validate chapter and set linkage
  const question = await MCQQuestion.findById(questionId);
  if (!question || question.isDeleted)
    return next(new ErrorHandler("Question not found", 404));

  // Prevent cross-chapter linkage if question already has a chapterId set and it differs
  if (
    question.chapterId &&
    String(question.chapterId) !== String(paper.chapterId)
  ) {
    return next(
      new ErrorHandler("Question belongs to a different chapter", 400)
    );
  }

  // Ensure question has the same chapterId as the paper
  if (!question.chapterId) question.chapterId = paper.chapterId;
  // Set paper linkage on the question
  question.paperId = paper._id;
  await question.save();

  // Add to paper if not already present
  if (!paper.questionIds.find((q) => String(q) === String(questionId))) {
    paper.questionIds.push(questionId);
    await paper.save();
  }

  res
    .status(200)
    .json({ success: true, message: "Question added to paper", paper });
});

export const removeQuestionFromPaper = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params; // paper id
    const { questionId } = req.body;
    if (!questionId)
      return next(new ErrorHandler("questionId is required", 400));

    const paper = await MCQPaper.findById(id);
    if (!paper || paper.isDeleted)
      return next(new ErrorHandler("Paper not found", 404));

    paper.questionIds = paper.questionIds.filter(
      (q) => String(q) !== String(questionId)
    );
    await paper.save();

    // If the question points to this paper, unset the linkage
    await MCQQuestion.findOneAndUpdate(
      { _id: questionId, paperId: paper._id },
      { $unset: { paperId: 1 } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Question removed from paper", paper });
  }
);

export const listMCQPapersWithQuestions = CatchAsyncError(
  async (req, res, next) => {
    console.log("Query params:", req.body, req.query);

    const { labId, labSectionId, chapterId, status } = req.query;

    if (!labId) return next(new ErrorHandler("labId is required", 400));
    if (!chapterId) return next(new ErrorHandler("chapterId is required", 400));

    const paperQuery = { isDeleted: false, labId, chapterId };
    if (labSectionId) paperQuery.labSectionId = labSectionId;
    if (status && String(status).toLowerCase() !== "any") {
      paperQuery.status = String(status).toLowerCase();
    }

    // Availability gating
    const isAdmin =
      req.user?.role === "lab_admin" || req.user?.role === "admin";
    const purchasedLabIds = Array.isArray(req.purchasedLabIds)
      ? req.purchasedLabIds.map((x) => x.toString())
      : [];
    if (!isAdmin) {
      if (labId) {
        const allowDisabled = purchasedLabIds.includes(String(labId));
        paperQuery.$or = allowDisabled
          ? [{ availability: "active" }, { availability: "disabled" }]
          : [{ availability: "active" }];
      } else {
        paperQuery.availability = "active";
      }
    }

    const papers = await MCQPaper.find(paperQuery)
      .populate({ path: "chapterId", select: "title" })
      .sort({ createdAt: -1 })
      .lean();

    const paperIds = papers.map((p) => p._id);
    const questions = await MCQQuestion.find({
      paperId: { $in: paperIds },
      isDeleted: false,
      status: "published",
      chapterId,
    })
      .lean()
      .sort({ createdAt: 1 });

    const questionsByPaper = {};
    for (const q of questions) {
      const key = String(q.paperId);
      if (!questionsByPaper[key]) questionsByPaper[key] = [];
      questionsByPaper[key].push(q);
    }

    const result = papers.map((p) => ({
      ...p,
      questions: questionsByPaper[String(p._id)] || [],
    }));

    res.status(200).json({ success: true, papers: result });
  }
);
