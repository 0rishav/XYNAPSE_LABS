import MCQPaper from "../models/mcqPaperModel.js";

export const findOrCreatePaperByChapter = async (chapterId, userId, session) => {
  let paper = await MCQPaper.findOne({ chapterId, status: "draft" }).session(session);

  if (paper) return paper._id;

  const [newPaper] = await MCQPaper.create(
    [{
      title: `MCQ Paper - Chapter ${chapterId}`,
      chapterId,
      status: "draft",
      createdBy: userId,
      questionIds: []
    }],
    { session }
  );

  return newPaper._id;
};