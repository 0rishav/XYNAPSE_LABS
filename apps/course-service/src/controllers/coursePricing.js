import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createPricingService,
  deletePricingService,
  getAdminPricingService,
  getPublicPricingService,
  patchSinglePlanService,
  updatePricingService,
} from "../services/course-pricing.service.js";

export const createCoursePricing = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Creating pricing for Course: ${courseId}`,
  );

  const pricing = await createPricingService(
    courseId,
    req.body.plans,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Course pricing created successfully",
    pricing,
  );
});

export const updateCoursePricing = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Updating pricing for Course: ${courseId}`,
  );

  const pricing = await updatePricingService(
    courseId,
    req.body.plans,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Course pricing updated successfully",
    pricing,
  );
});

export const patchSinglePlan = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId, planCode } = req.params;

  logger.info(
    `[${requestId}] Controller: Patching Plan: ${planCode} for Course: ${courseId}`,
  );

  const updatedPricing = await patchSinglePlanService(
    courseId,
    planCode,
    req.body,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `Plan ${planCode} updated successfully`,
    updatedPricing,
  );
});

export const getAdminCoursePricing = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Admin fetching pricing for Course: ${courseId}`,
  );

  const pricing = await getAdminPricingService(courseId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Pricing data fetched successfully",
    pricing,
  );
});

export const deleteCoursePricing = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(`[${requestId}] Controller: Deleting pricing for Course: ${courseId}`);

  await deletePricingService(courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Course pricing deleted successfully", null);
});

export const getPublicCoursePricing = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(`[${requestId}] Controller: Fetching active plans for Course: ${courseId}`);

  const pricing = await getPublicPricingService(courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Active plans fetched successfully", pricing);
});
