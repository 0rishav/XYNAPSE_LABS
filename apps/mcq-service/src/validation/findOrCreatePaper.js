import MCQPaper from "../models/mcqPaperModel.js";

export const findOrCreatePaper = async (data, userId, session) => {
  
  let paper = await MCQPaper.findOne({ 
      title: data.paperTitle || "Default Paper", 
      author: userId 
  }).session(session);

  if (!paper) {
    const [newPaper] = await MCQPaper.create(
      [{
        title: data.paperTitle || "Default Paper",
        author: userId,
        chapterId: data.chapterId,
        questionIds: []
      }],
      { session }
    );
    paper = newPaper;
  }

  return paper._id;
};