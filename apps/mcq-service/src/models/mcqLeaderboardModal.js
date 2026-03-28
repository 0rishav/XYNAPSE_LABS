import mongoose from "mongoose";

const mcqLeaderboardSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "MCQPaper",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },

    totalScore: { type: Number, default: 0, index: true },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },

    attempts: { type: Number, default: 1 },
    isFinal: { type: Boolean, default: true },

    lastSubmissionAt: { type: Date, default: Date.now },

    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

mcqLeaderboardSchema.index({ contestId: 1, userId: 1 }, { unique: true });

mcqLeaderboardSchema.index({
  contestId: 1,
  totalScore: -1,
  correctAnswers: -1,
  lastSubmissionAt:-1
});

const MCQLeaderboard = mongoose.model("MCQLeaderboard", mcqLeaderboardSchema);
export default MCQLeaderboard;
