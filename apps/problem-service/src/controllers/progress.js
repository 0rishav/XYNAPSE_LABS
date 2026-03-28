import mongoose from "mongoose";
// import { CatchAsyncError } from "../middleware/CatchAsyncError.js";
// import { isAuthenticated } from "../middleware/auth.js";
// import ErrorHandler from "../utils/ErrorHandler.js";
import UserProgress from "../models/progressModal.js";
import Chapter from "../models/chapterModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

// POST /progress/chapter/read
export const markChapterRead = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { labId, sectionId, chapterId } = req.body || {};

  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  if (!labId || !chapterId)
    return next(new ErrorHandler("labId and chapterId are required", 400));

  const payload = {
    userId,
    labId,
    sectionId: sectionId || undefined,
    chapterId,
    type: "chapter",
    status: "read",
    readAt: new Date(),
  };

  await UserProgress.findOneAndUpdate(
    { userId, labId, type: "chapter", chapterId },
    { $set: payload },
    { upsert: true, new: true },
  );

  res.status(200).json({ success: true, message: "Chapter marked as read" });
});

// GET /progress/lab/:labId
export const getLabProgress = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { labId } = req.params;

  if (!userId) return next(new ErrorHandler("Unauthorized", 401));
  if (!labId) return next(new ErrorHandler("labId is required", 400));

  // total chapters in this lab (active & not deleted)
  const totalChapters = await Chapter.countDocuments({
    labId,
    isDeleted: { $ne: true },
    isActive: { $ne: false },
  });

  // user's read chapters for this lab
  const readDocs = await UserProgress.find(
    { userId, labId, type: "chapter" },
    { chapterId: 1 },
  ).lean();
  const readChapterIds = readDocs.map((d) => String(d.chapterId));
  const readCount = readChapterIds.length;
  const percent =
    totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;

  res
    .status(200)
    .json({
      success: true,
      labId,
      totalChapters,
      readCount,
      percent,
      readChapterIds,
    });
});
