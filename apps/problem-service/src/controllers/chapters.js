import mongoose from "mongoose";
import Chapter from "../models/chapterModal.js";
import fs from "fs";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { validateCreateChapter } from "../../../../packages/common/src/utils/validation.js";

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export const createChapter = CatchAsyncError(async (req, res, next) => {
  try {
    const value = validateCreateChapter(req.body);
    const slug = generateSlug(req.body.title);
    let thumbnailUpload;

    if (req.file) {
      thumbnailUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: "chapters",
      });
    }

    const chapter = await Chapter.create({
      ...value,
      slug,
      thumbnail: thumbnailUpload
        ? {
            url: thumbnailUpload.secure_url,
            public_id: thumbnailUpload.public_id,
          }
        : null,
      createdBy: req.user._id,
    });

    // const keys = await redis.keys("chapters:*");
    // if (keys.length) await redis.del(keys);

    res.status(201).json({
      success: true,
      message: "Chapter Created !!",
      chapter,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Unable to delete file", unlinkErr);
        }
      });
    }
  }
});

export const setAvailabilityMode = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { availability } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const validAvailabilities = ["active", "inactive", "disabled"];
  if (!availability || !validAvailabilities.includes(availability)) {
    return next(
      new ErrorHandler(
        "Invalid availability. Allowed: active, inactive, disabled",
        400
      )
    );
  }

  const chapter = await Chapter.findById(id);
  if (!chapter || chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or deleted", 404));
  }

  // Availability strictly controls show/hide in listings (not access locking)
  chapter.availability = availability;

  chapter.updatedBy = req.user._id;
  await chapter.save();

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: `Chapter availability updated to ${availability}`,
    chapter,
  });
});

export const updateChapter = CatchAsyncError(async (req, res, next) => {
  let newThumbnailUpload;

  try {
    const { id } = req.params;
    const chapter = await Chapter.findById(id);

    if (!chapter) {
      return next(new ErrorHandler("Chapter not found", 404));
    }

    if (req.file) {
      newThumbnailUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: "chapters",
      });

      if (chapter.thumbnail && chapter.thumbnail.public_id) {
        await cloudinary.uploader.destroy(chapter.thumbnail.public_id);
      }

      chapter.thumbnail = {
        url: newThumbnailUpload.secure_url,
        public_id: newThumbnailUpload.public_id,
      };
    }

    const updatableFields = [
      "title",
      "description",
      "labId",
      "labsectionId",
      "level",
      "accessLevel",
      "isFree",
      "estimatedTime",
      "metaTitle",
      "metaDescription",
      "keywords",
      "visibility",
      "status",
      "resources",
      "rolesAllowed",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        chapter[field] = req.body[field];
      }
    });

    chapter.updatedBy = req.user._id;
    await chapter.save({ validateBeforeSave: false });

    // const keys = await redis.keys("chapters:*");
    // if (keys.length) await redis.del(keys);
    // await redis.del(`chapter:${id}`);

    res.status(200).json({
      success: true,
      message: "Chapter updated !!",
      chapter,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message, 500));
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Unable to delete local file", unlinkErr);
        }
      });
    }
  }
});

export const getAllChapters = CatchAsyncError(async (req, res, next) => {
  const {
    page = 1,
    limit = 60,
    labId,
    labsectionId,
    status,
    level,
    visibility,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return next(new ErrorHandler("Invalid pagination values", 400));
  }

  if (labId && !mongoose.Types.ObjectId.isValid(labId)) {
    return next(new ErrorHandler("Invalid labId", 400));
  }
  if (labsectionId && !mongoose.Types.ObjectId.isValid(labsectionId)) {
    return next(new ErrorHandler("Invalid labsectionId", 400));
  }

  // 🔴 Redis cache clear temporarily disabled
  // await redis.del("chapters:*");

  const filters = {};
  if (labId) filters.labId = labId;
  if (labsectionId) filters.labsectionId = labsectionId;
  if (status) filters.status = status;
  if (level) filters.level = level;
  if (visibility) filters.visibility = visibility;

  filters.isDeleted = { $ne: true };

  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";
  if (!isAdmin) {
    filters.availability = "active";
    filters.status = "published";
  }

  const skip = (pageNum - 1) * limitNum;
  const [chapters, total] = await Promise.all([
    Chapter.find(filters)
      .populate("labId", "name")
      .populate("labsectionId", "title")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ chapterNumber: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Chapter.countDocuments(filters),
  ]);

  const response = {
    success: true,
    message: "Chapters fetched successfully",
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    chapters,
  };

  res.status(200).json(response);
});

export const getChapterById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const cacheKey = `chapter:${id}`;

  const cachedChapter = await redis.get(cacheKey);
  if (cachedChapter) {
    return res.status(200).json({
      success: true,
      message: "Chapter fetched successfully from cache",
      chapter: cachedChapter,
    });
  }

  const chapter = await Chapter.findOne({ _id: id, isDeleted: { $ne: true } });

  if (!chapter) {
    return next(new ErrorHandler("Chapter not found", 404));
  }

  // For non-admin users, enforce availability access
  const isAdmin = req.user?.role === "lab_admin" || req.user?.role === "admin";
  if (!isAdmin) {
    // Chapter must be active to be reachable by end users
    if (chapter.availability !== "active") {
      return next(new ErrorHandler("Chapter not accessible", 403));
    }

    // Visibility controls locking
    // public => everyone; private => only paid users; restricted => blocked for now
    if (chapter.visibility === "private") {
      const isPaidUser = !!req.isPaidUser;
      if (!isPaidUser) {
        return next(
          new ErrorHandler("Payment required to access this chapter", 402)
        );
      }
    } else if (chapter.visibility === "restricted") {
      return next(new ErrorHandler("Chapter is restricted", 403));
    }
  }

  // await redis.set(cacheKey, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: "Chapter fetched successfully",
    chapter,
  });
});

export const deleteChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const chapter = await Chapter.findById(id);

  if (!chapter) {
    return next(new ErrorHandler("Chapter not found or already deleted", 404));
  }

  chapter.isDeleted = true;
  chapter.updatedBy = req.user._id;
  await chapter.save();

  if (chapter.thumbnail && chapter.thumbnail.public_id) {
    await cloudinary.uploader.destroy(chapter.thumbnail.public_id);
  }

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.del(`chapter:${id}`);

  res.status(200).json({
    success: true,
    message: "Chapter deleted !!",
  });
});

export const hardDeleteChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }
  const chapter = await Chapter.findById(id);
  if (!chapter) {
    return next(new ErrorHandler("Chapter not found", 404));
  }
  if (chapter.thumbnail && chapter.thumbnail.public_id) {
    await cloudinary.uploader.destroy(chapter.thumbnail.public_id);
  }
  await Chapter.findByIdAndDelete(id);
  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.del(`chapter:${id}`);
  res.status(200).json({
    success: true,
    message: "Chapter permanently deleted",
  });
});

export const restoreChapter = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const chapter = await Chapter.findById(id);

  if (!chapter || !chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or already active", 404));
  }

  chapter.isDeleted = false;
  chapter.updatedBy = req.user._id;
  await chapter.save();

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: "Chapter restored successfully",
    chapter,
  });
});

export const searchChapters = CatchAsyncError(async (req, res, next) => {
  const { query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim() === "") {
    return next(new ErrorHandler("Search query is required", 400));
  }

  const cacheKey = `chapters:search:${query}:page:${page}:limit:${limit}`;

  // 🔴 Redis get (commented)
  // const cachedData = await redis.get(cacheKey);
  // if (cachedData) {
  //   return res.status(200).json(cachedData);
  // }

  const skip = (page - 1) * limit;

  const [chapters, total] = await Promise.all([
    Chapter.find(
      { $text: { $search: query }, isDeleted: false, isActive: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(parseInt(limit)),
    Chapter.countDocuments({
      $text: { $search: query },
      isDeleted: false,
      isActive: true,
    }),
  ]);

  const response = {
    success: true,
    message: "Chapters fetched !!",
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit),
    chapters,
  };

  // 🔴 Redis set (commented)
  // await redis.set(cacheKey, response, { ex: 300 });

  res.status(200).json(response);
});

export const toggleChapterStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(req.body);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const validStatus = ["draft", "published", "archived"];
  if (!status || !validStatus.includes(status)) {
    return next(new ErrorHandler("Invalid status value", 400));
  }

  const chapter = await Chapter.findById(id);
  if (!chapter || chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or deleted", 404));
  }

  chapter.status = status;
  chapter.updatedBy = req.user._id;
  await chapter.save();

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: `Chapter status updated to ${status}`,
    chapter,
  });
});

export const updateVisibility = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { visibility } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const validVisibilities = ["public", "private", "restricted"];
  if (!visibility || !validVisibilities.includes(visibility)) {
    return next(
      new ErrorHandler(
        "Invalid visibility. Allowed: public, private, restricted",
        400
      )
    );
  }

  const chapter = await Chapter.findById(id);
  if (!chapter || chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or deleted", 404));
  }

  chapter.visibility = visibility;
  chapter.updatedBy = req.user._id;
  await chapter.save();

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: `Visibility updated to ${visibility}`,
    chapter,
  });
});

export const incrementEngagement = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { field } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const allowedFields = ["views", "likes", "bookmarks"];
  if (!field || !allowedFields.includes(field)) {
    return next(
      new ErrorHandler("Invalid field. Allowed: views, likes, bookmarks", 400)
    );
  }

  const chapter = await Chapter.findByIdAndUpdate(
    id,
    { $inc: { [field]: 1 }, updatedBy: req.user._id },
    { new: true }
  );

  if (!chapter || chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or deleted", 404));
  }

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: `${field} incremented successfully`,
    chapter,
  });
});

export const manageResources = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { action, resource } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Chapter ID", 400));
  }

  const allowedActions = ["add", "remove"];
  if (!action || !allowedActions.includes(action)) {
    return next(new ErrorHandler("Invalid action. Allowed: add, remove", 400));
  }

  if (action === "add") {
    if (!resource || !resource.title || !resource.url || !resource.type) {
      return next(
        new ErrorHandler("Resource must have title, url, and type", 400)
      );
    }
    const validTypes = ["pdf", "video", "link"];
    if (!validTypes.includes(resource.type)) {
      return next(
        new ErrorHandler(
          "Invalid resource type. Allowed: pdf, video, link",
          400
        )
      );
    }
  }

  let updateQuery;
  if (action === "add") {
    updateQuery = { $push: { resources: resource }, updatedBy: req.user._id };
  } else if (action === "remove") {
    if (!resource || !resource._id) {
      return next(new ErrorHandler("Resource _id is required to remove", 400));
    }
    updateQuery = {
      $pull: { resources: { _id: resource._id } },
      updatedBy: req.user._id,
    };
  }

  const chapter = await Chapter.findByIdAndUpdate(id, updateQuery, {
    new: true,
  });

  if (!chapter || chapter.isDeleted) {
    return next(new ErrorHandler("Chapter not found or deleted", 404));
  }

  const keys = await redis.keys("chapters:*");
  if (keys.length) await redis.del(keys);
  await redis.set(`chapter:${id}`, chapter, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: `Resource ${action === "add" ? "added" : "removed"} successfully`,
    chapter,
  });
});

export const reorderChapters = CatchAsyncError(async (req, res, next) => {
  const { labId, chapters } = req.body;

  console.log("Received reorder request:", chapters);

  if (!labId) {
    console.log("labId missing in request");
    return next(new ErrorHandler("labId is required", 400));
  }

  if (!chapters || !Array.isArray(chapters)) {
    console.log("Invalid chapters array:", chapters);
    return next(new ErrorHandler("Chapters array is required", 400));
  }

  const chapterIds = chapters.map((ch) => ch._id);
  const existingChapters = await Chapter.find({
    _id: { $in: chapterIds },
    labId,
  });

  console.log(
    "Existing chapters in DB:",
    existingChapters.map((ch) => ch.title)
  );

  if (existingChapters.length !== chapters.length) {
    console.log(
      "Mismatch in chapters length:",
      existingChapters.length,
      chapters.length
    );
    return next(
      new ErrorHandler("One or more chapters not found in this lab", 404)
    );
  }

  // Map original positions
  const originalOrderMap = {};
  existingChapters.forEach((ch, idx) => {
    originalOrderMap[ch._id.toString()] = idx + 1; // original chapterNumber
  });

  // Prepare bulk operations
  const bulkOps = chapters.map((ch, idx) => ({
    updateOne: {
      filter: { _id: ch._id, labId },
      update: { $set: { chapterNumber: ch.chapterNumber } },
    },
  }));

  await Chapter.bulkWrite(bulkOps);

  // Build detailed movement info
  const movements = chapters.map((ch) => ({
    _id: ch._id,
    title: existingChapters.find((e) => e._id.toString() === ch._id.toString())
      .title,
    from: originalOrderMap[ch._id.toString()],
    to: ch.chapterNumber,
  }));

  console.log("Chapter movements:", movements);

  res.status(200).json({
    success: true,
    message: "Chapter sequence updated successfully",
    data: movements,
  });
});
