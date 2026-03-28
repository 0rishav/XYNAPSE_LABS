import mongoose from "mongoose";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import CourseFAQ from "../models/courseFaqModel.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";

export const createFAQService = async (data, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { courseId, question, answer, order } = data;

    const newFAQ = await CourseFAQ.create(
      [
        {
          courseId,
          question,
          answer,
          order: order || 0,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: FAQ created with ID: ${newFAQ[0]._id}`,
    );
    return newFAQ[0];
  } catch (error) {
    await session.abortTransaction();
    throw error instanceof ErrorHandler
      ? error
      : new ErrorHandler(error.message, 500);
  } finally {
    session.endSession();
  }
};

export const getCourseFAQsService = async (courseId, requestId) => {
  const faqs = await CourseFAQ.find({
    courseId,
    isPublished: true,
    isDeleted: false,
  })
    .sort({ order: 1 })
    .lean();

  if (!faqs || faqs.length === 0) {
    logger.warn(
      `[${requestId}] Service: No FAQs found for Course: ${courseId}`,
    );
  }

  return faqs;
};

export const updateFAQService = async (faqId, updateData, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { question, answer, order } = updateData;

    const updatedFAQ = await CourseFAQ.findOneAndUpdate(
      { _id: faqId, isDeleted: false },
      {
        $set: {
          ...(question && { question }),
          ...(answer && { answer }),
          ...(order !== undefined && { order }),
        },
      },
      { new: true, runValidators: true, session },
    );

    if (!updatedFAQ) {
      throw new ErrorHandler("FAQ not found", HTTP_STATUS.NOT_FOUND);
    }

    await session.commitTransaction();
    logger.info(`[${requestId}] Service: FAQ updated successfully: ${faqId}`);
    return updatedFAQ;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateFAQStatusService = async (faqId, isPublished, requestId) => {
  const faq = await CourseFAQ.findOneAndUpdate(
    { _id: faqId, isDeleted: false },
    { $set: { isPublished } },
    { new: true, runValidators: true },
  )
    .select("question isPublished")
    .lean();

  if (!faq) throw new ErrorHandler("FAQ not found", HTTP_STATUS.NOT_FOUND);

  logger.info(
    `[${requestId}] Service: FAQ status changed to ${isPublished} for ID: ${faqId}`,
  );
  return faq;
};

export const reorderFAQsService = async (faqsArray, requestId) => {
  if (!Array.isArray(faqsArray))
    throw new ErrorHandler("Invalid payload format", 400);

  const bulkOps = faqsArray.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  const result = await CourseFAQ.bulkWrite(bulkOps);

  logger.info(
    `[${requestId}] Service: Bulk reorder completed. Matched: ${result.matchedCount}`,
  );
  return { updatedCount: result.modifiedCount };
};

export const deleteFAQService = async (faqId, requestId) => {
  const result = await CourseFAQ.findOneAndUpdate(
    { _id: faqId, isDeleted: false },
    { $set: { isDeleted: true } },
  );

  if (!result) throw new ErrorHandler("FAQ not found or already deleted", 404);

  logger.warn(`[${requestId}] Service: FAQ soft-deleted ID: ${faqId}`);
  return true;
};

export const hardDeleteFAQService = async (faqId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const faq = await CourseFAQ.findById(faqId).session(session);

    if (!faq) {
      logger.error(`[${requestId}] Service: FAQ not found for hard delete. ID: ${faqId}`);
      throw new ErrorHandler(
        "FAQ record not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    await CourseFAQ.findByIdAndDelete(faqId).session(session);

    await session.commitTransaction();
    logger.info(`[${requestId}] Service: HARD DELETE SUCCESSFUL for FAQ ID: ${faqId}`);
    
    return true;
  } catch (error) {
    await session.abortTransaction();
    
    if (!(error instanceof ErrorHandler)) {
      logger.error(`[${requestId}] Service: Hard Delete Error: ${error.message}`);
      throw new ErrorHandler(
        "Internal server error during permanent deletion",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.INTERNAL_ERROR
      );
    }
    throw error;
  } finally {
    session.endSession();
  }
};
