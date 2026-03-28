import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { v2 as cloudinary } from "cloudinary";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { getPagination } from "../../../../packages/common/src/utils/paginationHelper.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  createContentService,
  getContentByIdService,
  getContentsByChapterService,
  hardDeleteContentService,
  softDeleteContentService,
  toggleContentStatusService,
  updateContentService,
} from "../services/content.service.js";

export const createContent = CatchAsyncError(async (req, res, next) => {

  const requestId = req.requestId || "INTERNAL";

  logger.info(
    `[${requestId}] Controller: Request to create content: ${req.body.title}`,
  );

  const content = await createContentService(
    req.body,
    req.user?._id,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "Content created successfully",
    content,
  );
});

export const updateContent = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  logger.info(`[${requestId}] Controller: Updating content ID: ${id}`);

  const updatedContent = await updateContentService(
    id,
    req.body,
    req.user?._id,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Content updated successfully",
    updatedContent,
  );
});

export const getContentsByChapter = CatchAsyncError(async (req, res, next) => {
  const { chapterId } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const pagination = getPagination(req.query);

  const { contents, total } = await getContentsByChapterService(
    chapterId,
    pagination,
    requestId,
  );

  return sendResponse(res, HTTP_STATUS.OK, "Contents fetched successfully", {
    total,
    page: pagination.page,
    limit: pagination.limit,
    contents,
  });
});

export const getContentById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const content = await getContentByIdService(id, requestId);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Content detail fetched successfully",
    content,
  );
});

export const toggleContentStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const content = await toggleContentStatusService(
    id,
    req.user?._id,
    requestId,
  );

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `Content ${content.isPublished ? "published" : "unpublished"} successfully`,
    content,
  );
});

export const softDeleteContent = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  await softDeleteContentService(id, req.user?._id, requestId);

  return sendResponse(res, HTTP_STATUS.OK, "Content moved to bin successfully");
});

export const hardDeleteContent = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const requestId = req.requestId || "INTERNAL";

  const result = await hardDeleteContentService(id, requestId);

  return sendResponse(res, HTTP_STATUS.OK, result.message);
});

export const getCloudinarySignature = CatchAsyncError(
  async (req, res, next) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "lessons/media";

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET,
    );

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Signature generated successfully",
      {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder,
      },
    );
  },
);
