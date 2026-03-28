import Streak from "../models/streakModal.js";
import User from "../models/userModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import Submission from "../../../submission-service/src/models/submissionModal.js";

export const updateStreak = CatchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  const { problemId } = req.body;

  if (!problemId) return next(new ErrorHandler("Problem ID is required", 400));

  // Normalize to LOCAL midnight (12:00 AM)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Find streak by the correct field name in schema
  let streak = await Streak.findOne({ userId: userId });

  if (!streak) {
    // Create a new streak document with fields defined in the schema
    streak = await Streak.create({
      userId: userId,
      streakDays: [today],
      longestStreak: 1,
      updatedAt: today,
      solvedByDate: problemId ? { [todayKey]: [problemId] } : {},
    });

    // Link the streak back to the user for Redux tracking
    await User.findByIdAndUpdate(userId, { streakId: streak._id }, { new: true });

    return res.status(201).json({ success: true, streak });
  }

  // Append today's date to streakDays if not already present
  const dateKey = (d) => new Date(d).setHours(0, 0, 0, 0);
  const hasToday = streak.streakDays.some((d) => dateKey(d) === dateKey(today));
  if (!hasToday) {
    streak.streakDays.push(today);
    // Optionally update longestStreak based on recomputation
    const currentStreak = computeCurrentStreak(streak.streakDays);
    streak.longestStreak = Math.max(streak.longestStreak || 0, currentStreak);
    streak.updatedAt = today;
    // ensure solvedByDate append as well
    if (problemId) {
      const list = streak.solvedByDate?.get(todayKey) || [];
      if (!list.find((id) => String(id) === String(problemId))) {
        list.push(problemId);
        streak.solvedByDate?.set(todayKey, list);
      }
    }
    await streak.save();
  } else if (problemId) {
    // If already has today, still make sure we record problemId for today
    const list = streak.solvedByDate?.get(todayKey) || [];
    if (!list.find((id) => String(id) === String(problemId))) {
      list.push(problemId);
      streak.solvedByDate?.set(todayKey, list);
      await streak.save();
    }
  }

  res.status(200).json({ success: true, streak });
});

// Helper to compute current consecutive-day streak counting back from today
const computeCurrentStreak = (streakDays) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daySet = new Set(streakDays.map((d) => new Date(d).setHours(0, 0, 0, 0)));
  let count = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (daySet.has(cursor.getTime())) {
    count += 1;
    cursor = new Date(cursor.getTime() - msPerDay);
  }
  return count;
};

export const getMyStreak = CatchAsyncError(async (req, res, next) => {
  const userId = req.user._id;
  let streak = await Streak.findOne({ userId });

  if (!streak) {
    // No streak yet: only provide current-month solved counts
    const { countsMap } = await getSolvedCountsForCurrentMonth(userId);
    return res.status(200).json({ success: true, streak: null, currentStreak: 0, remainingMsToday: getRemainingMsToday(), solvedCountsByDate: countsMap, solvedProblemIdsByDate: {} });
  }

  // Streak exists: provide all-time solved counts
  const currentStreak = computeCurrentStreak(streak.streakDays || []);
  const remainingMsToday = getRemainingMsToday();
  const { countsMap } = await getSolvedCountsAllTime(userId);
  // Convert solvedByDate Map to plain object
  const solvedProblemIdsByDate = {};
  if (streak.solvedByDate && streak.solvedByDate instanceof Map) {
    for (const [k, v] of streak.solvedByDate.entries()) {
      solvedProblemIdsByDate[k] = v;
    }
  } else if (streak.solvedByDate && typeof streak.solvedByDate === 'object') {
    Object.assign(solvedProblemIdsByDate, streak.solvedByDate);
  }
  res.status(200).json({ success: true, streak, currentStreak, remainingMsToday, solvedCountsByDate: countsMap, solvedProblemIdsByDate });
});

const getRemainingMsToday = () => {
  const now = new Date();
  // End of current LOCAL day (12:00 AM)
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  return Math.max(0, end - now);
};

// Aggregate 'Passed' submissions per day for the current month, counting distinct problems per day
const getSolvedCountsForCurrentMonth = async (userId) => {
  const now = new Date();
  // Use LOCAL month boundaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const pipeline = [
    { $match: { user: userId, executionResult: "Passed", createdAt: { $gte: monthStart, $lte: monthEnd } } },
    { $project: {
        day: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        problem: 1
      }
    },
    // Count distinct problems per day
    { $group: { _id: { day: "$day", problem: "$problem" }, count: { $sum: 1 } } },
    { $group: { _id: "$_id.day", problemsSolved: { $sum: 1 } } },
  ];

  const results = await Submission.aggregate(pipeline);
  const countsMap = {};
  results.forEach(r => { countsMap[r._id] = r.problemsSolved; });
  return { countsMap };
};

// Aggregate distinct problems solved (Passed) per day for all time
const getSolvedCountsAllTime = async (userId) => {
  const pipeline = [
    { $match: { user: userId, executionResult: "Passed" } },
    { $project: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        problem: 1
      }
    },
    { $group: { _id: { day: "$day", problem: "$problem" }, count: { $sum: 1 } } },
    { $group: { _id: "$_id.day", problemsSolved: { $sum: 1 } } },
  ];

  const results = await Submission.aggregate(pipeline);
  const countsMap = {};
  results.forEach(r => { countsMap[r._id] = r.problemsSolved; });
  return { countsMap };
};
