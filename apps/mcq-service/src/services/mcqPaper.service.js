import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import MCQPaper from "../models/mcqPaperModel.js";
import axios from "axios";
import MCQSubmission from "../models/mcqSubmissionModal.js";
import MCQQuestion from "../models/mcqQuestionModal.js";

export const createPaperService = async (data, files, userId, requestId) => {
  let uploadedThumb;

  if (files && files.thumbnail && files.thumbnail[0]) {
    uploadedThumb = await cloudinary.uploader.upload(files.thumbnail[0].path, {
      folder: "mcq_papers",
    });
  }

  const paperData = {
    ...data,
    thumbnail: uploadedThumb
      ? { url: uploadedThumb.secure_url, public_id: uploadedThumb.public_id }
      : undefined,
    createdBy: userId,
  };

  const paper = await MCQPaper.create(paperData);

  logger.info(`[${requestId}] Service: Paper ${paper._id} created`);
  return paper;
};

export const updatePaperService = async (id, data, file, userId, requestId) => {
  const paper = await MCQPaper.findById(id);
  if (!paper || paper.isDeleted) {
    throw new Error("Paper not found");
  }

  if (file) {
    if (paper.thumbnail?.public_id) {
      await cloudinary.uploader.destroy(paper.thumbnail.public_id);
    }
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "mcq_papers",
    });
    paper.thumbnail = { url: result.secure_url, public_id: result.public_id };
  }

  const fieldsToUpdate = [
    "title",
    "description",
    "chapterId",
    "courseId",
    "questionIds",
    "durationMinutes",
    "totalMarks",
    "maxAttempts",
    "type",
    "status",
    "isActive",
    "availability",
    "visibility",
  ];

  fieldsToUpdate.forEach((field) => {
    if (data[field] !== undefined) paper[field] = data[field];
  });

  paper.updatedBy = userId;
  await paper.save();

  logger.info(`[${requestId}] Service: Paper ${id} updated`);
  return paper;
};

export const deletePaperService = async (id, requestId) => {
  const paper = await MCQPaper.findById(id);

  if (!paper || paper.isDeleted) {
    throw new Error("Paper not found");
  }

  paper.isDeleted = true;
  await paper.save();

  await redis.del(`mcqPaper:list:${paper.chapterId}`);

  logger.info(`[${requestId}] Service: Paper ${id} soft-deleted successfully`);
  return true;
};

export const getPaperWithDetailsService = async (id, requestId) => {
  const paper = await MCQPaper.findById(id).lean();
  if (!paper || paper.isDeleted) throw new Error("Paper not found");

  let chapterData = null;
  try {
    const chapRes = await axios.get(
      `${process.env.COURSE_SERVICE_URL}/api/v1/chapter/${paper.chapterId}`,
      {
        headers: { "x-request-id": requestId },
      },
    );
    chapterData = chapRes.data;
  } catch (err) {
    logger.warn(
      `[${requestId}] Failed to fetch chapter details: ${err.message}`,
    );
  }

  let courseData = null;
  if (paper.courseId) {
    try {
      const courseRes = await axios.get(
        `${process.env.COURSE_SERVICE_URL}/api/v1/courses/verify/${paper.courseId}`,
        {
          headers: { "x-request-id": requestId },
        },
      );
      courseData = courseRes.data;
    } catch (err) {
      logger.warn(
        `[${requestId}] Failed to fetch course details: ${err.message}`,
      );
    }
  }

  return {
    ...paper,
    chapter: chapterData,
    course: courseData,
  };
};

export const listPapersService = async (query, userId, cacheKey, requestId) => {

  const papers = await MCQPaper.find(query).sort({ createdAt: -1 }).lean();
  if (papers.length === 0) return { papers: [], cached: false };

  const uniqueChapterIds = [...new Set(papers.map((p) => p.chapterId.toString()))];
  const chapterDetails = {};
  
  await Promise.all(uniqueChapterIds.map(async (chapId) => {
    try {
      const res = await axios.get(`${process.env.COURSE_SERVICE_URL}/api/v1/chapter/${chapId}`, {
        headers: { "x-request-id": requestId },
      });
      chapterDetails[chapId] = res.data;
    } catch (err) {
      logger.error(`[${requestId}] Failed to fetch chapter ${chapId}: ${err.message}`);
    }
  }));

  const paperIds = papers.map((p) => p._id);
  const submissions = await MCQSubmission.aggregate([
    { $match: { userId, paperId: { $in: paperIds }, isDeleted: false } },
    { $group: { _id: "$paperId", count: { $sum: 1 } } },
  ]);

  const attemptMap = submissions.reduce((acc, sub) => {
    acc[sub._id.toString()] = sub.count;
    return acc;
  }, {});

  const papersWithAttempts = papers.map((paper) => {
    const attemptCount = attemptMap[paper._id.toString()] || 0;
    return {
      ...paper,
      chapter: chapterDetails[paper.chapterId.toString()] || null,
      attemptInfo: {
        currentAttempt: attemptCount,
        maxAttempts: paper.maxAttempts,
        remainingAttempts: Math.max(0, paper.maxAttempts - attemptCount),
        disabled: attemptCount >= paper.maxAttempts,
      },
    };
  });

  return { papers: papersWithAttempts, cached: false };
};

export const getPaperQuestionsService = async (id, status, requestId) => {

  const paper = await MCQPaper.findById(id).lean();
  if (!paper || paper.isDeleted) throw new Error("Paper not found");

  let chapterData = null;
  try {

    const chapRes = await axios.get(`${process.env.COURSE_SERVICE_URL}/api/v1/chapter/${paper.chapterId}`, {
      headers: { "x-request-id": requestId },
    });
    
    chapterData = chapRes.data;
  } catch (err) {
    logger.warn(`[${requestId}] Failed to fetch chapter ${paper.chapterId}: ${err.message}`);
  }

  const questionQuery = { _id: { $in: paper.questionIds }, isDeleted: false };
  if (status && status !== "any") questionQuery.status = String(status).toLowerCase();

  const rawQuestions = await MCQQuestion.find(questionQuery).lean();
  const qMap = new Map(rawQuestions.map((q) => [String(q._id), q]));
  const questions = paper.questionIds.map((qid) => qMap.get(String(qid))).filter(Boolean);

  return { ...paper, chapter: chapterData, questions };
};

export const addQuestionToPaperService = async (paperId, questionId, requestId) => {
  const paper = await MCQPaper.findById(paperId);
  if (!paper || paper.isDeleted) {
    throw new Error("Paper not found");
  }

  const question = await MCQQuestion.findById(questionId);
  if (!question || question.isDeleted) {
    throw new Error("Question not found");
  }

  if (question.chapterId && String(question.chapterId) !== String(paper.chapterId)) {
    throw new Error("Question belongs to a different chapter");
  }

  if (!question.chapterId) question.chapterId = paper.chapterId;
  question.paperId = paper._id;
  await question.save();

  if (!paper.questionIds.find((q) => String(q) === String(questionId))) {
    paper.questionIds.push(questionId);
    await paper.save();
  }

  return paper;
};

export const removeQuestionFromPaperService = async (paperId, questionId, requestId) => {

  const paper = await MCQPaper.findById(paperId);
  if (!paper || paper.isDeleted) {
    throw new Error("Paper not found");
  }

  const initialLength = paper.questionIds.length;
  paper.questionIds = paper.questionIds.filter(
    (q) => String(q) !== String(questionId)
  );

  if (paper.questionIds.length === initialLength) {
    throw new Error("Question not found in this paper");
  }

  await paper.save();

  await MCQQuestion.findOneAndUpdate(
    { _id: questionId, paperId: paper._id },
    { $unset: { paperId: "" } } 
  );

  return paper;
};

export const listPapersWithQuestionsService = async (filters, user, requestId) => {

  const { courseId, chapterId, status } = filters;

  const paperQuery = { isDeleted: false, chapterId };
  if (courseId) paperQuery.courseId = courseId;
  if (status && status !== "any") {
    paperQuery.status = status;
  }

  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    paperQuery.availability = "active";
    paperQuery.status = "published";
  }

  const papers = await MCQPaper.find(paperQuery)
    .populate({ path: "chapterId", select: "title" })
    .sort({ createdAt: -1 })
    .lean();

  if (!papers.length) return [];

  const paperIds = papers.map((p) => p._id);
  const questions = await MCQQuestion.find({
    paperId: { $in: paperIds },
    isDeleted: false,
  })
    .lean()
    .sort({ createdAt: 1 });

  const questionsByPaper = questions.reduce((acc, q) => {
    const key = String(q.paperId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  return papers.map((p) => ({
    ...p,
    questions: questionsByPaper[String(p._id)] || [],
  }));
};

export const updatePaperStatusService = async (id, status, userId, requestId) => {
  const paper = await MCQPaper.findByIdAndUpdate(
    id,
    { 
      status: status,
      updatedBy: userId 
    },
    { new: true }
  );

  if (paper) {
    logger.info(`[${requestId}] Service: Paper ${id} status updated to ${status}`);
  }

  return paper;
};
