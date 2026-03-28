import mongoose from "mongoose";
import LabSection from "../models/labSectionModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";
import {
  deleteFromCloudinary,
  deleteLocalFiles,
  uploadOnCloudinary,
} from "../../../../packages/common/src/infra/uploadOnCloudinary.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";

export const createLabSection = CatchAsyncError(async (req, res, next) => {
  const file = req.file;

  const sanitized = sanitizeObject(req.body, {
    lab: "string",
    title: "string",
    description: "string",
    isVisible: "boolean",
    order: "number",
    visibilityScope: "string",
    isPremiumOnly: "boolean",
  });

  const {
    lab,
    title,
    description,
    order,
    isVisible,
    visibilityScope,
    isPremiumOnly,
  } = sanitized;

  if (!lab || !mongoose.Types.ObjectId.isValid(lab)) {
    return next(new ErrorHandler("Valid Lab ID is required", 400));
  }

  if (!title?.trim()) {
    return next(new ErrorHandler("Section title is required", 400));
  }

  const slug = title.toLowerCase().trim().replace(/\s+/g, "-");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return next(new ErrorHandler("Invalid slug format", 400));
  }

  const existing = await LabSection.findOne({ lab, slug });
  if (existing) {
    return next(
      new ErrorHandler("Section with same title already exists", 409),
    );
  }

  const allowedScopes = ["public", "private", "enrolled_only"];
  if (visibilityScope && !allowedScopes.includes(visibilityScope)) {
    return next(new ErrorHandler("Invalid visibility scope", 400));
  }

  let iconData = {};
  try {
    if (file) {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.mimetype)) {
        return next(new ErrorHandler("Unsupported image type", 400));
      }

      const result = await uploadOnCloudinary(file.path);
      if (!result?.secure_url) {
        return next(new ErrorHandler("Icon upload failed", 500));
      }

      iconData = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    }

    const section = await LabSection.create({
      lab,
      title: title.trim(),
      slug,
      description: description?.trim(),
      icon: iconData,
      order: order || 0,
      isVisible: isVisible !== false,
      isPremiumOnly: isPremiumOnly || false,
      visibilityScope: visibilityScope || "public",
      meta: {
        createdBy: req.user._id,
      },
    });

    await redis.del(`labSections:${lab}`);

    res.status(201).json({
      success: true,
      message: "Lab section created successfully",
      section,
    });
  } catch (error) {
    return next(
      new ErrorHandler(error.message || "Internal server error", 500),
    );
  } finally {
    if (file?.path) {
      deleteLocalFiles(file.path);
    }
  }
});

export const updateLabSection = CatchAsyncError(async (req, res, next) => {
  const sectionId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    return next(new ErrorHandler("Invalid Section ID", 400));
  }

  const existingSection = await LabSection.findById(sectionId);
  if (!existingSection) {
    return next(new ErrorHandler("Lab section not found", 404));
  }

  const file = req.file;

  const sanitized = sanitizeObject(req.body, {
    title: "string",
    description: "string",
    isVisible: "boolean",
    order: "number",
    visibilityScope: "string",
    isPremiumOnly: "boolean",
  });

  const {
    title,
    description,
    isVisible,
    order,
    visibilityScope,
    isPremiumOnly,
  } = sanitized;

  try {
    if (title && title !== existingSection.title) {
      const newSlug = title.toLowerCase().trim().replace(/\s+/g, "-");

      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return next(new ErrorHandler("Invalid slug format", 400));
      }

      const slugExists = await LabSection.findOne({
        lab: existingSection.lab,
        slug: newSlug,
        _id: { $ne: existingSection._id },
      });

      if (slugExists) {
        return next(
          new ErrorHandler(
            "Another section with same slug already exists",
            409,
          ),
        );
      }

      existingSection.title = title.trim();
      existingSection.slug = newSlug;
    }

    if (file) {
      if (existingSection.icon?.public_id) {
        await deleteFromCloudinary(existingSection.icon.public_id);
      }

      const result = await uploadOnCloudinary(file.path);
      if (!result?.secure_url) {
        return next(new ErrorHandler("Icon upload failed", 500));
      }

      existingSection.icon = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    }

    // Other fields
    if (description !== undefined)
      existingSection.description = description.trim();
    if (typeof isVisible === "boolean") existingSection.isVisible = isVisible;
    if (typeof order === "number") existingSection.order = order;
    if (visibilityScope) existingSection.visibilityScope = visibilityScope;
    if (typeof isPremiumOnly === "boolean")
      existingSection.isPremiumOnly = isPremiumOnly;

    existingSection.meta.lastEditedBy = req.user._id;

    await existingSection.save();
    await redis.del(`labSections:${existingSection.lab}`);

    res.status(200).json({
      success: true,
      message: "Lab section updated successfully",
      section: existingSection,
    });
  } catch (err) {
    return next(new ErrorHandler(err.message || "Internal Server Error", 500));
  } finally {
    if (file?.path) {
      deleteLocalFiles(file.path);
    }
  }
});

export const getAllLabSections = CatchAsyncError(async (req, res, next) => {
  const { labId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(labId)) {
    return next(new ErrorHandler("Invalid Lab ID", 400));
  }

  const cacheKey = `labSections:${labId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Lab sections fetched from cache",
      sections: cached,
    });
  }

  const sections = await LabSection.find({
    lab: labId,
    deletedAt: null,
    isVisible: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .select("title slug description icon order isPremiumOnly visibilityScope")
    .populate("lab", "_id name")
    .lean();

  await redis.set(cacheKey, sections, { ex: 60 * 60 });

  res.status(200).json({
    success: true,
    message: "Lab sections fetched successfully",
    sections,
  });
});

export const getLabSectionById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid section ID", 400));
  }

  const section = await LabSection.findById(id)
    .where("deletedAt")
    .equals(null)
    .populate("lab", "name slug")
    .lean();

  if (!section) {
    return next(new ErrorHandler("Lab section not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Lab section fetched successfully",
    section,
  });
});

export const deleteLabSection = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid section ID", 400));
  }

  const section = await LabSection.findById(id);

  if (!section || section.deletedAt) {
    return next(
      new ErrorHandler("Lab section not found or already deleted", 404),
    );
  }

  if (section.icon?.public_id) {
    try {
      await cloudinary.uploader.destroy(section.icon.public_id);
      section.icon = {};
    } catch (err) {
      console.error("Cloudinary icon deletion failed:", err.message);
    }
  }

  section.deletedAt = new Date();
  section.meta.lastEditedBy = req.user._id;

  await section.save();

  await redis.del(`labSections:${section.lab}`);

  res.status(200).json({
    success: true,
    message: "Lab section deleted successfully",
  });
});

export const getMinimalSectionsByLab = CatchAsyncError(
  async (req, res, next) => {
    const { labId } = req.params;

    const cacheKey = `lab:${labId}:sections:minimal`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Lab sections fetched from cache",
        data: cached,
      });
    }

    const sections = await LabSection.find(
      { lab: labId },
      { _id: 1, title: 1 },
    ).lean();

    await redis.set(cacheKey, sections, { ex: 3600 });

    res.status(200).json({
      success: true,
      message: "Lab sections fetched !!",
      data: sections,
    });
  },
);
