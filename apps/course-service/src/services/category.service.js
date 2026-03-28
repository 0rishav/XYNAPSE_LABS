import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import Category from "../models/categoryModel.js";
import slugify from "slugify";
import fs from "fs";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";

export const createCategoryService = async (
  payload,
  file,
  session,
  context,
) => {
  const { name, description, sortOrder, createdBy } = payload;
  const { requestId } = context;

  const existingCategory = await Category.findOne({
    name,
    isDeleted: false,
  }).session(session);
  if (existingCategory) {
    throw new ErrorHandler(
      "Category already exists",
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONFLICT,
    );
  }

  let iconUrl = "";
  if (file) {
    try {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "xynapse_categories",
      });
      iconUrl = uploadRes.secure_url;
      fs.unlinkSync(file.path);
    } catch (error) {
      console.error("DETAILED CLOUDINARY ERROR:", error);
      logger.error(`[CloudinaryError] RID: ${requestId} - ${error.message}`);
      throw new ErrorHandler(
        "Image upload failed",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  const slug = slugify(name, { lower: true, strict: true });
  const newCategory = await Category.create(
    [{ name, slug, description, icon: iconUrl, sortOrder, createdBy }],
    { session },
  );

  logger.info(
    `[CategoryCreated] RID: ${requestId} - ID: ${newCategory[0]._id}`,
  );
  return newCategory[0];
};

export const updateCategoryService = async (
  id,
  payload,
  file,
  session,
  context,
) => {
  const { requestId } = context;

  const category = await Category.findOne({
    _id: id,
    isDeleted: false,
  }).session(session);
  if (!category) {
    throw new ErrorHandler(
      "Category not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (payload.name) {
    payload.slug = slugify(payload.name, { lower: true, strict: true });
  }

  if (file) {
    try {
      if (category.icon) {
        const publicId = category.icon.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`xynapse_categories/${publicId}`);
      }

      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "xynapse_categories",
      });
      payload.icon = uploadRes.secure_url;
      fs.unlinkSync(file.path);
    } catch (error) {
      if (file) fs.unlinkSync(file.path);
      throw new ErrorHandler(
        "Image update failed",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, session },
  );

  logger.info(`[CategoryUpdated] RID: ${requestId} - ID: ${id}`);
  return updatedCategory;
};

export const getAllCategoriesService = async (pagination, context) => {
  const { page, limit, skip } = pagination;
  const { requestId } = context;

  const filter = { isActive: true, isDeleted: false };

  const [categories, totalCount] = await Promise.all([
    Category.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .lean(), 
    Category.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  logger.info(`[CategoriesFetched] RID: ${requestId} - Count: ${categories.length}`);

  return {
    categories,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
};

export const getCategoryBySlugService = async (slug, context) => {
  const category = await Category.findOne({ slug, isDeleted: false }).lean();
  
  if (!category) {
    throw new ErrorHandler("Category not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  logger.info(`[CategoryFetchedBySlug] RID: ${context.requestId} - Slug: ${slug}`);
  return category;
};

export const toggleCategoryStatusService = async (id, updatedBy, session, context) => {
  const category = await Category.findOne({ _id: id, isDeleted: false }).session(session);
  
  if (!category) {
    throw new ErrorHandler("Category not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  category.isActive = !category.isActive;
  category.updatedBy = updatedBy;
  await category.save({ session });

  logger.info(`[CategoryStatusToggled] RID: ${context.requestId} - ID: ${id} - Status: ${category.isActive}`);
  return category;
};

export const softDeleteCategoryService = async (id, updatedBy, session, context) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { 
      $set: { isDeleted: true, updatedBy } 
    },
    { new: true, session }
  );

  if (!category) {
    throw new ErrorHandler("Category not found or already deleted", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  logger.info(`[CategorySoftDeleted] RID: ${context.requestId} - ID: ${id}`);
  return category;
};

export const hardDeleteCategoryService = async (id, session, context) => {
  const { requestId } = context;

  const category = await Category.findById(id).session(session);
  if (!category) {
    throw new ErrorHandler("Category not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (category.icon) {
    try {
      const publicId = category.icon.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`xynapse_categories/${publicId}`);
    } catch (error) {
      logger.error(`[CloudinaryDeleteError] RID: ${requestId} - ${error.message}`);
    }
  }

  await Category.findByIdAndDelete(id).session(session);

  logger.warn(`[CategoryHardDeleted] RID: ${requestId} - ID: ${id} - Name: ${category.name}`);
  
  return category;
};