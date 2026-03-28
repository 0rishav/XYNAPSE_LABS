import mongoose from "mongoose";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Content from "../models/contentModel.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import Chapter from "../models/chapterModel.js";
import slugify from "slugify";

export const createContentService = async (data, userId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let { title, chapterId, courseId, blocks, seo } = data;

    if (typeof blocks === 'string') {
      try {
        blocks = JSON.parse(blocks);
      } catch (e) {
        logger.error(`[${requestId}] Service: Failed to parse blocks string`);
        throw new ErrorHandler("Invalid blocks format", HTTP_STATUS.BAD_REQUEST);
      }
    }

    if (typeof seo === 'string') {
      try {
        seo = JSON.parse(seo);
      } catch (e) {
        logger.error(`[${requestId}] Service: Failed to parse seo string`);
      }
    }

    if (seo && typeof seo.keywords === 'string') {
      try {
        seo.keywords = JSON.parse(seo.keywords.replace(/'/g, '"')); 
      } catch (e) {
        seo.keywords = seo.keywords.split(',').map(k => k.trim());
      }
    }

    logger.info(`[${requestId}] Service: Validating Chapter: ${chapterId} for Course: ${courseId}`);

    const chapterExists = await Chapter.findOne({ 
        _id: chapterId, 
        courseId: courseId, 
        isDeleted: false 
    }).session(session);

    if (!chapterExists) {
      throw new ErrorHandler("Invalid Chapter or Course mapping", HTTP_STATUS.BAD_REQUEST);
    }

    const generatedSlug = slugify(title, { lower: true, strict: true });

    const existingContent = await Content.findOne({
      chapterId,
      slug: generatedSlug,
      isDeleted: false,
    }).session(session);

    if (existingContent) {
      throw new ErrorHandler("Content with this title already exists", HTTP_STATUS.CONFLICT);
    }

    const newContent = await Content.create(
      [
        {
          ...data,
          blocks,
          seo,    
          slug: generatedSlug,
          createdBy: userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return newContent[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateContentService = async (contentId, updateData, userId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`[${requestId}] Service: Initiating update for Content ID: ${contentId}`);

    const existingContent = await Content.findOne({ _id: contentId, isDeleted: false }).session(session);
    if (!existingContent) {
      throw new ErrorHandler("Content not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const finalCourseId = updateData.courseId || existingContent.courseId;
    const finalChapterId = updateData.chapterId || existingContent.chapterId;

    if (updateData.chapterId || updateData.courseId) {
      const chapterValid = await Chapter.findOne({
        _id: finalChapterId,
        courseId: finalCourseId,
        isDeleted: false
      }).session(session);

      if (!chapterValid) {
        throw new ErrorHandler("Invalid Chapter-Course mapping", HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST);
      }
    }

    if (updateData.title) {
      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
      
      const duplicate = await Content.findOne({
        _id: { $ne: contentId },
        chapterId: finalChapterId,
        slug: updateData.slug,
        isDeleted: false
      }).session(session);

      if (duplicate) {
        throw new ErrorHandler("Another content with this title already exists in this chapter", HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_EXISTS);
      }
    }

    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { $set: { ...updateData, updatedBy: userId } },
      { new: true, runValidators: true, session }
    );

    await session.commitTransaction();
    logger.info(`[${requestId}] Service: Content updated successfully: ${contentId}`);
    return updatedContent;

  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Service: Update failed for Content ${contentId}: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getContentsByChapterService = async (chapterId, pagination, requestId) => {
  const { limit, skip } = pagination;
  
  logger.info(`[${requestId}] Service: Fetching contents for Chapter: ${chapterId}`);

  const [contents, total] = await Promise.all([
    Content.find({ chapterId, isDeleted: false })
      .sort({ createdAt: 1 }) 
      .skip(skip)
      .limit(limit)
      .lean(),
    Content.countDocuments({ chapterId, isDeleted: false })
  ]);

  return { contents, total };
};

export const getContentByIdService = async (contentId, requestId) => {
  logger.info(`[${requestId}] Service: Fetching detailed content for ID: ${contentId}`);

  const content = await Content.findOne({ _id: contentId, isDeleted: false }).lean();

  if (!content) {
    throw new ErrorHandler(
      "Content not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  return content;
};

export const toggleContentStatusService = async (contentId, userId, requestId) => {
  logger.info(`[${requestId}] Service: Toggling publish status for Content: ${contentId}`);

  const content = await Content.findById(contentId).select("isPublished isDeleted");

  if (!content || content.isDeleted) {
    throw new ErrorHandler("Content not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  content.isPublished = !content.isPublished;
  content.updatedBy = userId;
  
  await content.save();

  logger.info(`[${requestId}] Service: Content status updated to: ${content.isPublished}`);

  return {
    _id: content._id,
    isPublished: content.isPublished,
    updatedAt: new Date() 
  };
};

export const softDeleteContentService = async (contentId, userId, requestId) => {
  logger.info(`[${requestId}] Service: Soft deleting content: ${contentId}`);

  const content = await Content.findByIdAndUpdate(
    contentId,
    { 
      $set: { isDeleted: true, updatedBy: userId } 
    },
    { new: true }
  );

  if (!content) {
    throw new ErrorHandler("Content not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return content;
};

export const hardDeleteContentService = async (contentId, requestId) => {
  logger.info(`[${requestId}] Service: Hard deleting content: ${contentId}`);

  const content = await Content.findByIdAndDelete(contentId);

  if (!content) {
    throw new ErrorHandler("Content not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  return { message: "Content permanently removed from database" };
};