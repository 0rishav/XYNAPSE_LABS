import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createFAQService,
  deleteFAQService,
  getCourseFAQsService,
  hardDeleteFAQService,
  reorderFAQsService,
  updateFAQService,
  updateFAQStatusService,
} from "../services/course-faq.service.js";

export const createFAQ = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const faqData = req.body;

  logger.info(
    `[${requestId}] Controller: Creating FAQ for Course: ${faqData.courseId}`,
  );

  const result = await createFAQService(faqData, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "FAQ created successfully",
    result,
  );
});

export const getCourseFAQs = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { courseId } = req.params;

  logger.info(
    `[${requestId}] Controller: Fetching FAQs for Course: ${courseId}`,
  );

  const faqs = await getCourseFAQsService(courseId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "FAQs fetched successfully", faqs);
});

export const updateFAQ = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { faqId } = req.params;
  const updateData = req.body;

  logger.info(`[${requestId}] Controller: Updating FAQ: ${faqId}`);

  const result = await updateFAQService(faqId, updateData, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "FAQ updated successfully", result);
});

export const updateFAQStatus = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { faqId } = req.params;
  const { isPublished } = req.body;

  const result = await updateFAQStatusService(faqId, isPublished, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `FAQ ${isPublished ? "published" : "hidden"} successfully`,
    result,
  );
});

export const reorderFAQs = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { faqs } = req.body;

  const result = await reorderFAQsService(faqs, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "FAQs reordered successfully",
    result,
  );
});

export const deleteFAQ = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { faqId } = req.params;

  await deleteFAQService(faqId, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "FAQ deleted successfully", null);
});

export const hardDeleteFAQ = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { faqId } = req.params;

  logger.warn(
    `[${requestId}] Admin Controller: INITIATING PERMANENT DELETE for FAQ ID: ${faqId}`,
  );

  await hardDeleteFAQService(faqId, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "FAQ record has been permanently purged from the system",
    null,
  );
});
