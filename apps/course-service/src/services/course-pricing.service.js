import mongoose from "mongoose";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import CoursePricing from "../models/coursePricingModel.js";

export const createPricingService = async (courseId, plans, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingPricing = await CoursePricing.findOne({ courseId }).session(
      session,
    );
    if (existingPricing) {
      throw new ErrorHandler(
        "Pricing already exists for this course. Use PUT to update.",
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.ALREADY_EXISTS,
      );
    }

    const newPricing = await CoursePricing.create([{ courseId, plans }], {
      session,
    });

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Pricing created for Course: ${courseId}`,
    );
    return newPricing[0];
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Create pricing failed: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const updatePricingService = async (courseId, plans, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedPricing = await CoursePricing.findOneAndUpdate(
      { courseId },
      { plans },
      {
        new: true,
        runValidators: true,
        session,
        upsert: false,
      },
    );

    if (!updatedPricing) {
      throw new ErrorHandler(
        "Pricing configuration not found for this course",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Pricing updated for Course: ${courseId}`,
    );
    return updatedPricing;
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Update pricing failed: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const patchSinglePlanService = async (
  courseId,
  planCode,
  updateData,
  requestId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateQuery = {};
    for (const [key, value] of Object.entries(updateData)) {
      updateQuery[`plans.$.${key}`] = value;
    }

    const updatedPricing = await CoursePricing.findOneAndUpdate(
      { courseId, "plans.planCode": planCode },
      { $set: updateQuery },
      { session, new: true, runValidators: true },
    );

    if (!updatedPricing) {
      throw new ErrorHandler(
        "Course or Plan not found",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Successfully patched ${planCode} for ${courseId}`,
    );
    return updatedPricing;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[${requestId}] Service: Patch plan failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAdminPricingService = async (courseId, requestId) => {
  const pricing = await CoursePricing.findOne({ courseId });

  if (!pricing) {
    logger.warn(
      `[${requestId}] Service: No pricing found for Course: ${courseId}`,
    );
    throw new ErrorHandler(
      "Pricing not configured for this course",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return pricing;
};

export const deletePricingService = async (courseId, requestId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deleted = await CoursePricing.findOneAndDelete({ courseId }).session(
      session,
    );

    if (!deleted) {
      throw new ErrorHandler(
        "Pricing not found for this course",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }

    await session.commitTransaction();
    logger.info(
      `[${requestId}] Service: Pricing deleted for Course: ${courseId}`,
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[${requestId}] Service: Delete pricing failed: ${error.message}`,
    );
    throw error;
  } finally {
    session.endSession();
  }
};

export const getPublicPricingService = async (courseId, requestId) => {
  const pricing = await CoursePricing.findOne(
    { courseId },
    { plans: { $elemMatch: { isActive: true } } },
  ).lean();

  if (!pricing) {
    return { courseId, plans: [] };
  }

  const activePlans = pricing.plans
    .filter((plan) => plan.isActive === true)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...pricing,
    plans: activePlans,
  };
};
