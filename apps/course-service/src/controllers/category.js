import mongoose from "mongoose";
// import { redis } from "../utils/redisClient.js";
import fs from "fs";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import {
  createCategoryService,
  getAllCategoriesService,
  getCategoryBySlugService,
  hardDeleteCategoryService,
  softDeleteCategoryService,
  toggleCategoryStatusService,
  updateCategoryService,
} from "../services/category.service.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { getPagination } from "../../../../packages/common/src/utils/paginationHelper.js";

export const createCategory = CatchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };
    const iconFile = req.file;

    const payload = { ...req.body, createdBy: req.user.id };

    const category = await createCategoryService(
      payload,
      iconFile,
      session,
      context,
    );

    await session.commitTransaction();
    session.endSession();

    sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Category created successfully",
      category,
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next(error);
  }
});

export const updateCategory = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };
    const payload = { ...req.body, updatedBy: req.user.id };

    const category = await updateCategoryService(
      id,
      payload,
      req.file,
      session,
      context,
    );

    await session.commitTransaction();
    session.endSession();

    sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category updated successfully",
      category,
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
});

export const getAllCategories = CatchAsyncError(async (req, res, next) => {
  const context = { requestId: req.requestId };

  const pagination = getPagination(req.query);

  const result = await getAllCategoriesService(pagination, context);

  sendResponse(res, HTTP_STATUS.OK, "Categories fetched successfully", result);
});

export const getCategoryBySlug = CatchAsyncError(async (req, res, next) => {
  const category = await getCategoryBySlugService(req.params.slug, {
    requestId: req.requestId,
  });
  sendResponse(res, HTTP_STATUS.OK, "Category fetched successfully", category);
});

export const toggleCategoryStatus = CatchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await toggleCategoryStatusService(
      req.params.id,
      req.user.id,
      session,
      { requestId: req.requestId },
    );
    await session.commitTransaction();
    sendResponse(
      res,
      HTTP_STATUS.OK,
      `Category is now ${result.isActive ? "Active" : "Inactive"}`,
      result,
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const softDeleteCategory = CatchAsyncError(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await softDeleteCategoryService(req.params.id, req.user.id, session, {
      requestId: req.requestId,
    });
    await session.commitTransaction();
    sendResponse(res, HTTP_STATUS.OK, "Category deleted successfully");
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const hardDeleteCategory = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const context = { requestId: req.requestId };

    await hardDeleteCategoryService(id, session, context);

    await session.commitTransaction();
    session.endSession();

    sendResponse(
      res,
      HTTP_STATUS.OK,
      "Category permanently deleted from system",
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});
