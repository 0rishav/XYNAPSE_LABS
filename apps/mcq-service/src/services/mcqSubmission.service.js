import { verifyChapterExists } from "../internal-api/verifyChapterExist.js";
import { verifyCourseExists } from "../internal-api/verifyCourseExist.js";
import MCQPaper from "../models/mcqPaperModel.js";
import MCQQuestion from "../models/mcqQuestionModal.js";
import MCQSubmission from "../models/mcqSubmissionModal.js";

export const createSubmissionService = async (data, userId, requestId) => {
  const { chapterId, courseId, paperId, answers, mode } = data;

  const isChapterValid = await verifyChapterExists(chapterId, requestId);
  if (!isChapterValid) throw new Error("Invalid ChapterId");

  if (courseId) {
    const isCourseValid = await verifyCourseExists(courseId, requestId);
    if (!isCourseValid) throw new Error("Invalid CourseId");
  }

  const paper = await MCQPaper.findById(paperId);
  if (!paper || paper.isDeleted || !paper.isActive) {
    throw new Error("MCQ Paper not found or inactive");
  }

  const pastAttempts = await MCQSubmission.countDocuments({ userId, paperId, isDeleted: false, isFinal: true });
  if (pastAttempts >= paper.maxAttempts) throw new Error("Maximum attempts reached for this paper");

  let correctAnswers = 0;
  let totalScore = 0;

  const evaluatedAnswers = await Promise.all(
    answers.map(async (ans) => {
      const question = await MCQQuestion.findById(ans.questionId).lean();
      if (!question) return null;

      const correctOptionIndexes = question.options
        .map((opt, idx) => (opt.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);

      const isCorrect =
        correctOptionIndexes.length === ans.selectedOptions.length &&
        correctOptionIndexes.every((idx) => ans.selectedOptions.includes(idx));

      const marksAwarded = isCorrect ? question.marks : (question.negativeMarks || 0) * -1;
      
      if (isCorrect) correctAnswers += 1;
      totalScore += marksAwarded;

      return {
        questionId: ans.questionId,
        selectedOptions: ans.selectedOptions,
        isCorrect,
        marksAwarded,
        timeTaken: ans.timeTaken || 0,
      };
    }),
  );

  const finalAnswers = evaluatedAnswers.filter((a) => a !== null);

  const submission = await MCQSubmission.create({
    userId,
    chapterId,
    courseId,
    paperId,
    mode,
    answers: finalAnswers,
    totalQuestions: finalAnswers.length,
    correctAnswers,
    wrongAnswers: finalAnswers.length - correctAnswers,
    totalScore,
    isFinal: mode !== "practice",
    attemptNumber: pastAttempts + 1,
  });

  return { submission, attemptNumber: pastAttempts + 1, maxAttempts: paper.maxAttempts };
};

export const getMySubmissionsService = async (
  userId,
  page,
  limit,
  requestId,
) => {
  const skip = (page - 1) * limit;
  const submissions = await MCQSubmission.find({ userId, isDeleted: false })
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return { data: submissions };
};

export const getSubmissionByIdService = async (
  userId,
  submissionId,
  requestId,
) => {
  const submission = await MCQSubmission.findOne({
    _id: submissionId,
    userId,
    isDeleted: false,
  }).lean();

  if (!submission) throw new Error("Submission not found");

  const detailedAnswers = await Promise.all(
    submission.answers.map(async (ans) => {
      const question = await MCQQuestion.findById(ans.questionId).lean();
      if (!question) return null;

      return {
        ...ans,
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

  const [pastAttempts, paper] = await Promise.all([
    MCQSubmission.countDocuments({
      userId,
      paperId: submission.paperId,
      isDeleted: false,
    }),
    MCQPaper.findById(submission.paperId).lean(),
  ]);

  const attemptInfo = {
    currentAttempt: submission.attemptNumber,
    maxAttempts: paper?.maxAttempts ?? null,
    remainingAttempts:
      paper?.maxAttempts != null ? paper.maxAttempts - pastAttempts : null,
  };

  return { data: submission, attemptInfo };
};

export const deleteSubmissionService = async (userId, submissionId, requestId) => {
  const submission = await MCQSubmission.findOne({
    _id: submissionId,
    userId,
    isDeleted: false,
  });

  if (!submission) {
    throw new Error("Submission not found or already deleted");
  }

  submission.isDeleted = true;
  await submission.save();

  return true;
};

export const evaluateSubmissionService = async (submissionId, requestId) => {

  const submission = await MCQSubmission.findById(submissionId);
  if (!submission || submission.isDeleted) {
    throw new Error("Submission not found");
  }

  if (submission.status === "evaluated") {
    throw new Error("Submission already evaluated");
  }

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
  return submission;
};

export const finalizeSubmissionService = async (userId, submissionId, requestId) => {

  const submission = await MCQSubmission.findOne({
    _id: submissionId,
    userId,
    isDeleted: false,
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  if (submission.isFinal) {
    throw new Error("Submission already finalized");
  }

  submission.isFinal = true;
  submission.status = "submitted";
  await submission.save();

  return submission;
};

export const reviewSubmissionService = async (userId, submissionId, requestId) => {
  const submission = await MCQSubmission.findOne({
    _id: submissionId,
    userId,
    isDeleted: false,
  }).lean();

  if (!submission) {
    throw new Error("Submission not found");
  }

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
    })
  );

  return review.filter((r) => r !== null);
};

export const getUserStatsService = async (userId, requestId) => {
  const submissions = await MCQSubmission.find({
    userId,
    isDeleted: false,
  }).lean();

  const stats = submissions.reduce(
    (acc, sub) => {
      acc.totalSubmissions += 1;
      acc.totalQuestions += sub.totalQuestions || 0;
      acc.correctAnswers += sub.correctAnswers || 0;
      acc.wrongAnswers += sub.wrongAnswers || 0;
      acc.totalScore += sub.totalScore || 0;
      return acc;
    },
    {
      totalSubmissions: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalScore: 0,
    }
  );

  return stats;
};

export const getCourseStatsService = async (courseId, requestId) => {

  const isCourseValid = await verifyCourseExists(courseId, requestId);
  if (!isCourseValid) {
    throw new Error("Invalid CourseId");
  }

  const submissions = await MCQSubmission.find({
    courseId,
    isDeleted: false,
  }).lean();

  return submissions.reduce(
    (acc, sub) => {
      acc.totalSubmissions += 1;
      acc.totalQuestions += sub.totalQuestions || 0;
      acc.correctAnswers += sub.correctAnswers || 0;
      acc.wrongAnswers += sub.wrongAnswers || 0;
      acc.totalScore += sub.totalScore || 0;
      return acc;
    },
    {
      totalSubmissions: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalScore: 0,
    }
  );
};

export const getQuestionStatsService = async (questionId, requestId) => {
  const submissions = await MCQSubmission.find({
    "answers.questionId": questionId,
    isDeleted: false,
  }).lean();

  const stats = submissions.reduce(
    (acc, sub) => {
      const ans = sub.answers.find((a) => String(a.questionId) === String(questionId));
      if (ans) {
        acc.totalAttempts += 1;
        if (ans.isCorrect) {
          acc.correctAttempts += 1;
        } else {
          acc.wrongAttempts += 1;
        }
      }
      return acc;
    },
    { totalAttempts: 0, correctAttempts: 0, wrongAttempts: 0 }
  );

  return {
    ...stats,
    accuracy: stats.totalAttempts > 0 
      ? (stats.correctAttempts / stats.totalAttempts) * 100 
      : 0,
  };
};

export const getAllSubmissionsService = async (page, limit, requestId) => {
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    MCQSubmission.find({ isDeleted: false })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MCQSubmission.countDocuments({ isDeleted: false }),
  ]);

  return { submissions, total };
};

export const hardDeleteSubmissionService = async (submissionId, requestId) => {
  const submission = await MCQSubmission.findByIdAndDelete(submissionId);
  
  if (!submission) {
    throw new Error("Submission not found");
  }

  return true;
};

export const updateSubmissionStatusService = async (submissionId, status, requestId) => {
    
  const validStatuses = ["in-progress", "submitted", "evaluated"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status value");
  }

  const submission = await MCQSubmission.findByIdAndUpdate(
    submissionId,
    { status },
    { new: true }
  );

  if (!submission) {
    throw new Error("Submission not found");
  }

  return submission;
};