import mongoose from "mongoose";
import logger from "../../../../packages/common/src/utils/logger.js";
import ContentShare from "../models/contentShareModel.js";
import ContentStats from "../models/contentStatsModel.js";
import ContentLike from "../models/contentLikeModel.js";
import { getPagination } from "../../../../packages/common/src/utils/paginationHelper.js";

export const toggleContentLikeService = async (
  contentId,
  userId,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingLike = await ContentLike.findOne({
      contentId,
      userId,
    }).session(session);
    let message = "";
    let data = null;

    if (existingLike) {
      await ContentLike.deleteOne({ _id: existingLike._id }).session(session);
      await ContentStats.findOneAndUpdate(
        { contentId },
        { $inc: { likesCount: -1 } },
        { session, upsert: true },
      );
      message = "Like removed";
    } else {
      data = await ContentLike.create([{ contentId, userId }], { session });
      await ContentStats.findOneAndUpdate(
        { contentId },
        { $inc: { likesCount: 1 } },
        { session, upsert: true },
      );
      message = "Content liked successfully";
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Like toggle successful for Content: ${contentId}`,
    );
    return { message, data };
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Like toggle failed: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const shareContentService = async (
  contentId,
  userId,
  platform,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newShare = await ContentShare.create(
      [{ contentId, userId, platform }],
      { session },
    );

    await ContentStats.findOneAndUpdate(
      { contentId },
      { $inc: { sharesCount: 1 } },
      { session, upsert: true },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Share recorded for Content: ${contentId}`,
    );
    return newShare[0];
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Service: Sharing failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getContentStatsService = async (contentId, requestId) => {
  logger.info(
    `[${requestId}] Service: Finding stats for Content: ${contentId}`,
  );

  const stats = await ContentStats.findOne({ contentId });

  return stats || { views: 0, likesCount: 0, sharesCount: 0 };
};

export const trackContentViewService = async (contentId, requestId) => {
  try {
    await ContentStats.findOneAndUpdate(
      { contentId },
      { $inc: { views: 1 } },
      { upsert: true, new: true },
    );
    logger.info(
      `[${requestId}] Service: View incremented for Content: ${contentId}`,
    );
  } catch (error) {
    logger.error(
      `[${requestId}] Service: Failed to track view: ${error.message}`,
    );
    throw error;
  }
};

export const getMyLikedContentService = async (userId, query, requestId) => {
  const { page, limit, skip } = getPagination(query);

  logger.info(`[${requestId}] Service: Querying liked content for User: ${userId} | Page: ${page}`);

  const [likes, total] = await Promise.all([
    ContentLike.find({ userId })
      .populate({
        path: "contentId",
        select: "title slug thumbnail duration", 
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ContentLike.countDocuments({ userId }),
  ]);

  return {
    likes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
