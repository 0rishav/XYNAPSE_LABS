import mongoose from "mongoose";
import UserProgress from "../models/progressModel.js";
import Content from "../models/contentModel.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

export const updateContentProgressService = async (
  userId,
  contentId,
  status,
  metadata,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const content = await Content.findOne({
      _id: contentId,
      isDeleted: false,
    }).session(session);

    if (!content) {
      logger.error(
        `[${requestId}] Service: Content not found ID: ${contentId}`,
      );
      throw new ErrorHandler(
        "Content not found or has been deleted",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, contentId, type: "content" },
      {
        status,
        metadata,
        readAt: status === "read" ? new Date() : undefined,
      },
      { upsert: true, new: true, session, runValidators: true },
    );

    if (status === "read") {
      const chapterId = content.chapterId;

      const totalRequired = await Content.countDocuments({
        chapterId,
        isDeleted: false,
      }).session(session);

      const totalRead = await UserProgress.countDocuments({
        userId,
        type: "content",
        contentId: { $in: await Content.find({ chapterId }).distinct("_id") },
        status: "read",
      }).session(session);

      if (totalRead === totalRequired) {
        await UserProgress.findOneAndUpdate(
          { userId, chapterId, type: "chapter" },
          { status: "read", readAt: new Date() },
          { upsert: true, session },
        );
        logger.info(
          `[${requestId}] Service: Chapter ${chapterId} auto-completed for User: ${userId}`,
        );
      }
    }

    await session.commitTransaction();
    return progress;
  } catch (error) {
    await session.abortTransaction();
    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Unexpected Progress Error: ${error.message}`,
      );
      throw new ErrorHandler(
        error.message || "Internal Server Error during progress update",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateChapterProgressService = async (
  userId,
  chapterId,
  status,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const chapterExists = await mongoose
      .model("Chapter")
      .exists({ _id: chapterId });
    if (!chapterExists) {
      throw new ErrorHandler(
        "Chapter not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, chapterId, type: "chapter" },
      {
        status,
        readAt: status === "read" ? new Date() : undefined,
      },
      {
        upsert: true,
        new: true,
        session,
        runValidators: true,
      },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Manual chapter update successful: ${chapterId} for User: ${userId}`,
    );

    return progress;
  } catch (error) {
    await session.abortTransaction();

    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Chapter Progress Update Error: ${error.message}`,
      );
      throw new ErrorHandler(
        "Failed to update chapter progress",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const getCourseProgressService = async (userId, courseId, requestId) => {
  try {
    const courseExists = await mongoose
      .model("Course")
      .exists({ _id: courseId });
    if (!courseExists) {
      throw new ErrorHandler(
        "Course not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const chapters = await mongoose
      .model("Chapter")
      .find({ courseId, isDeleted: false })
      .distinct("_id");

    const totalContentsCount = await mongoose.model("Content").countDocuments({
      chapterId: { $in: chapters },
      isDeleted: false,
    });

    if (totalContentsCount === 0) {
      return { percentage: 0, completedContents: 0, totalContents: 0 };
    }

    const completedContentsCount = await UserProgress.countDocuments({
      userId,
      type: "content",
      status: "read",
      contentId: {
        $in: await mongoose
          .model("Content")
          .find({ chapterId: { $in: chapters } })
          .distinct("_id"),
      },
    });

    const percentage = Math.round(
      (completedContentsCount / totalContentsCount) * 100,
    );

    return {
      percentage,
      completedContents: completedContentsCount,
      totalContents: totalContentsCount,
    };
  } catch (error) {
    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Course Progress Fetch Error: ${error.message}`,
      );
      throw new ErrorHandler(
        "Failed to fetch course progress",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  }
};

export const getContentStatusService = async (userId, contentId, requestId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new ErrorHandler(
        "Invalid Content ID",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_INPUT,
      );
    }

    const progress = await UserProgress.findOne({
      userId,
      contentId,
      type: "content",
    }).select("status readAt metadata");

    if (!progress) {
      return { status: "not_started", readAt: null, metadata: {} };
    }

    return progress;
  } catch (error) {
    if (!(error instanceof ErrorHandler)) {
      logger.error(
        `[${requestId}] Service: Content Status Fetch Error: ${error.message}`,
      );
      throw new ErrorHandler(
        "Failed to fetch content status",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  }
};

export const resumeCourseService = async (userId, courseId, requestId) => {
  try {
    const chapters = await mongoose
      .model("Chapter")
      .find({ courseId, isDeleted: false })
      .sort({ sortOrder: 1 });
    const chapterIds = chapters.map((c) => c._id);

    const allContents = await Content.find({
      chapterId: { $in: chapterIds },
      isDeleted: false,
    }).sort({ chapterId: 1, sortOrder: 1 });

    if (allContents.length === 0) {
      throw new ErrorHandler(
        "No content found in this course",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    const lastProgress = await UserProgress.findOne({
      userId,
      type: "content",
      status: "read",
    })
      .where("contentId")
      .in(allContents.map((c) => c._id))
      .sort({ readAt: -1 });

    let resumeContent = allContents[0];
    if (lastProgress) {
      const lastIndex = allContents.findIndex(
        (c) => c._id.toString() === lastProgress.contentId.toString(),
      );
      if (lastIndex !== -1 && lastIndex < allContents.length - 1) {
        resumeContent = allContents[lastIndex + 1];
      } else {
        resumeContent = allContents[lastIndex];
      }
    }

    return { resumeContent };
  } catch (error) {
    if (!(error instanceof ErrorHandler)) {
      throw new ErrorHandler(
        error.message,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    throw error;
  }
};

export const getAdminUserProgressService = async (userId, requestId) => {
  try {
    const progress = await UserProgress.find({ userId })
      .populate("contentId", "title type")
      .populate("chapterId", "title")
      .sort({ updatedAt: -1 });

    return progress;
  } catch (error) {
    throw new ErrorHandler(
      "Failed to fetch user progress",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
};

export const getAdminCourseStatsService = async (courseId, requestId) => {
  try {
    const chapters = await mongoose
      .model("Chapter")
      .find({ courseId })
      .distinct("_id");

    const stats = await UserProgress.aggregate([
      {
        $match: {
          contentId: {
            $in: await mongoose
              .model("Content")
              .find({ chapterId: { $in: chapters } })
              .distinct("_id"),
          },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  } catch (error) {
    throw new ErrorHandler(
      "Failed to fetch course analytics",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
};
