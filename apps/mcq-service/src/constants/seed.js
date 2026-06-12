import MCQPaper from "../models/mcqPaperModel.js";
import MCQQuestion from "../models/mcqQuestionModal.js";

const paperId = "6a2c1738094029dadde818b4";
const chapterId = "69c7e077dd690ea89c86bf4a";

const questions = Array.from({ length: 10 }).map((_, i) => ({
  title: `Sample Question ${i + 1}: What is ${i + 1} + ${i + 1}?`,
  description: "Basic math",
  difficulty: "easy",
  tags: ["math", "basic"],
  options: [
    { text: "Wrong Answer", isCorrect: false },
    { text: `${(i + 1) * 2}`, isCorrect: true, explanation: "Correct!" },
    { text: "Wrong Answer", isCorrect: false },
    { text: "Wrong Answer", isCorrect: false },
  ],
  multipleCorrect: false,
  marks: 5,
  negativeMarks: 1,
  chapterId: chapterId,
  paperId: paperId,
  accessLevel: "free",
}));

export const seedDatabase = async () => {
  try {
    const createdQuestions = await MCQQuestion.insertMany(questions);
    const questionIds = createdQuestions.map((q) => q._id);

    await MCQPaper.findByIdAndUpdate(paperId, {
      $push: { questionIds: { $each: questionIds } },
    });

    console.log(`Successfully added ${questionIds.length} questions to Paper!`);
    process.exit();
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

export const publishAllQuestions = async () => {
  try {
    const result = await MCQQuestion.updateMany({
      $set: { status: "published" },
    });

    console.log(
      `Success! Updated ${result.modifiedCount} questions to 'published'.`,
    );
    process.exit();
  } catch (error) {
    console.error("Error updating status:", error);
    process.exit(1);
  }
};
