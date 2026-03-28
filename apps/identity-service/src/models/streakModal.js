import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  streakDays: { type: [Date], default: [] },
  longestStreak: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  solvedByDate: {
    type: Map,
    of: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
    default: {},
  },
});

streakSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Streak = mongoose.model("Streak", streakSchema);
export default Streak;
