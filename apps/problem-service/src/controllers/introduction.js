import Introduction from "../models/introductionModal.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createIntroduction = CatchAsyncError(async (req, res, next) => {
  const {
    lab,
    section,
    courseOverview,
    whyLearning,
    whatYouWillLearn,
    keyTopics,
    toolsAndTechnologies,
    careerImpact,
    conceptAndSkills,
  } = sanitizeObject(req.body, {
    lab: "string",
    section: "string",
    courseOverview: "string",
    whyLearning: "string",
    whatYouWillLearn: "string",
    keyTopics: "array",
    toolsAndTechnologies: "array",
    careerImpact: "string",
    conceptAndSkills: "object",
  });

  console.log(" Sanitized Object:", {
    lab,
    section,
    courseOverview,
    whyLearning,
    whatYouWillLearn,
    keyTopics,
    toolsAndTechnologies,
    careerImpact,
    conceptAndSkills,
  });

  if (
    !lab ||
    !section ||
    !courseOverview ||
    !whyLearning ||
    !whatYouWillLearn ||
    !Array.isArray(keyTopics) ||
    keyTopics.length === 0 ||
    !careerImpact ||
    !conceptAndSkills
  ) {
    return next(new ErrorHandler("Missing required fields", 400));
  }

  let toolsArray = toolsAndTechnologies;
  if (!Array.isArray(toolsArray)) {
    toolsArray = [toolsArray];
  }

  const uploadedIcons = [];
  const localFilesToDelete = [];

  try {
    const uploadedTools = await Promise.all(
      toolsArray.map(async (tool, index) => {
        let parsedTool;

        if (typeof tool === "string") {
          try {
            parsedTool = JSON.parse(tool);
          } catch (err) {
            parsedTool = { name: tool };
          }
        } else {
          parsedTool = tool;
        }

        const toolData = {
          name: parsedTool.name || parsedTool,
        };

        const file = req.files?.[index];
        if (file && file.path) {
          localFilesToDelete.push(file.path);
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "lab/icons",
          });

          uploadedIcons.push(result.public_id);

          toolData.icon = {
            public_id: result.public_id,
            secure_url: result.secure_url,
          };
        }

        return toolData;
      })
    );

    const introduction = await Introduction.create({
      lab,
      section,
      courseOverview,
      whyLearning,
      whatYouWillLearn,
      keyTopics,
      toolsAndTechnologies: uploadedTools,
      careerImpact,
      conceptAndSkills,
      createdBy: req.user._id,
    });

    await redis.del("all-introductions");

    return res.status(201).json({
      success: true,
      message: "Introduction created !!",
      introduction,
    });
  } catch (error) {
    await Promise.all(
      uploadedIcons.map((publicId) =>
        cloudinary.uploader.destroy(publicId).catch(() => null)
      )
    );
    return next(new ErrorHandler(error.message, 500));
  } finally {
    for (const filePath of localFilesToDelete) {
      const absolutePath = path.join(__dirname, `../${filePath}`);
      fs.unlink(absolutePath, (err) => {
        if (err) {
          console.error(`Unable to delete ${absolutePath}:`, err.message);
        } else {
          console.log(`Deleted local file ${absolutePath}`);
        }
      });
    }
  }
});

export const updateIntroduction = CatchAsyncError(async (req, res, next) => {
  console.log("Update Introduction called with body:", req.body);

  const introductionId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(introductionId)) {
    return next(new ErrorHandler("Invalid ID", 400));
  }

  const {
    lab,
    section,
    courseOverview,
    whyLearning,
    whatYouWillLearn,
    keyTopics,
    toolsAndTechnologies,
    careerImpact,
    conceptAndSkills,
  } = req.body;

  console.log("Sanitized body:", {
    lab,
    section,
    courseOverview,
    whyLearning,
    whatYouWillLearn,
    careerImpact,
  });

  // Check for required fields
  if (
    !lab ||
    !section ||
    !courseOverview ||
    !whyLearning ||
    !whatYouWillLearn ||
    !careerImpact
  ) {
    return next(
      new ErrorHandler(
        "Missing required fields: lab, section, courseOverview, whyLearning, whatYouWillLearn, careerImpact",
        400
      )
    );
  }

  // Validate keyTopics if provided
  if (keyTopics && (!Array.isArray(keyTopics) || keyTopics.length === 0)) {
    return next(new ErrorHandler("keyTopics must be a non-empty array", 400));
  }

  // Validate conceptAndSkills if provided
  if (
    conceptAndSkills &&
    (!conceptAndSkills.concepts || !conceptAndSkills.skills)
  ) {
    return next(
      new ErrorHandler(
        "conceptAndSkills must have concepts and skills arrays",
        400
      )
    );
  }

  const existing = await Introduction.findById(introductionId);
  if (!existing) {
    return next(new ErrorHandler("Introduction not found", 404));
  }

  const uploadedIcons = [];
  const publicIdsToDelete = [];
  const localFilesToDelete = [];

  try {
    let updatedTools = [];
    if (Array.isArray(toolsAndTechnologies)) {
      updatedTools = await Promise.all(
        toolsAndTechnologies.map(async (tool) => {
          if (!tool.name) return { name: tool };

          // Only process local paths
          if (
            tool.icon &&
            typeof tool.icon === "string" &&
            tool.icon.startsWith("uploads/")
          ) {
            localFilesToDelete.push(tool.icon);

            const result = await cloudinary.uploader.upload(tool.icon, {
              folder: "lab/icons",
            });

            uploadedIcons.push(result.public_id);
            return {
              name: tool.name,
              icon: {
                public_id: result.public_id,
                secure_url: result.secure_url,
              },
            };
          }

          // Already uploaded icons or missing icon
          return tool;
        })
      );
    }

    // Determine which old icons need deletion
    existing.toolsAndTechnologies.forEach((tool) => {
      if (
        !toolsAndTechnologies.some(
          (t) => t.icon?.public_id === tool.icon?.public_id
        )
      ) {
        publicIdsToDelete.push(tool.icon?.public_id);
      }
    });

    const updatedIntro = await Introduction.findByIdAndUpdate(
      introductionId,
      {
        lab,
        section,
        courseOverview,
        whyLearning,
        whatYouWillLearn,
        keyTopics,
        toolsAndTechnologies: updatedTools,
        careerImpact,
        conceptAndSkills,
        lastEditedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    await redis.del("all-introductions");

    return res.status(200).json({
      success: true,
      message: "Introduction updated!",
      introduction: updatedIntro,
    });
  } catch (error) {
    // Rollback any uploaded icons
    await Promise.all(
      uploadedIcons.map((publicId) =>
        cloudinary.uploader.destroy(publicId).catch(() => null)
      )
    );

    return next(new ErrorHandler(error.message, 500));
  } finally {
    // Delete local files
    for (const filePath of localFilesToDelete) {
      const absolutePath = path.join(__dirname, `../${filePath}`);
      fs.unlink(absolutePath, (err) => {
        if (err) console.error(`Failed to delete ${absolutePath}`, err.message);
      });
    }

    // Delete removed Cloudinary icons
    for (const publicId of publicIdsToDelete) {
      await cloudinary.uploader.destroy(publicId).catch(() => null);
    }
  }
});

export const getIntroduction = CatchAsyncError(async (req, res, next) => {
  const { labId, sectionId } = req.params;
  const cacheKey = `introduction:${labId}:${sectionId}`;

  const cachedData = await redis.get(cacheKey);
  if (false) {
    return res.status(200).json({
      success: true,
      fromCache: true,
      data: cachedData,
    });
  }

  const introduction = await Introduction.findOne({
    lab: labId,
    section: sectionId,
  })
    .populate("createdBy", "name email")
    .populate("lastEditedBy", "name email");

  if (!introduction) {
    return next(new ErrorHandler("Introduction not found", 404));
  }

  await redis.set(cacheKey, introduction, {
    ex: 3600,
  });

  res.status(200).json({
    success: true,
    fromCache: false,
    data: introduction,
  });
});

export const getAllIntroductions = CatchAsyncError(async (req, res, next) => {
  const { search, page = 1, limit = 10 } = req.query;
  console.log("received query:", req.query);

  // Clear cache to force fresh data with populated fields
  await redis.del("introductions:all:*");

  const query = {};
  if (search) {
    query.$or = [
      { courseOverview: { $regex: search, $options: "i" } },
      { whyLearning: { $regex: search, $options: "i" } },
      { whatYouWillLearn: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [introductions, total] = await Promise.all([
    Introduction.find(query)
      .populate("createdBy", "name email")
      .populate("lastEditedBy", "name email")
      .populate("lab", "name")
      .populate("section", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Introduction.countDocuments(query),
  ]);

  if (!introductions || introductions.length === 0) {
    return next(new ErrorHandler("No introductions found", 404));
  }

  const response = {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    data: introductions,
  };

  // Set cache with populated data
  const cacheKey = `introductions:all:${JSON.stringify(req.query)}`;
  await redis.set(cacheKey, response, {
    ex: 3600,
  });

  res.status(200).json({
    success: true,
    fromCache: false,
    ...response,
  });
});

export const deleteIntroduction = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Introduction ID", 400));
  }

  const introduction = await Introduction.findById(id);
  if (!introduction) {
    return next(new ErrorHandler("Introduction not found", 404));
  }

  // Delete associated icons from cloudinary
  const publicIdsToDelete = [];
  introduction.toolsAndTechnologies.forEach((tool) => {
    if (tool.icon?.public_id) {
      publicIdsToDelete.push(tool.icon.public_id);
    }
  });

  await introduction.deleteOne();

  await redis.del("all-introductions");

  // Clean up cloudinary assets
  for (const publicId of publicIdsToDelete) {
    await cloudinary.uploader.destroy(publicId).catch(() => null);
  }

  res.status(200).json({
    success: true,
    message: "Introduction deleted successfully",
  });
});

export const deleteTool = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorHandler("Invalid Tool ID", 400));
  }

  const cleanId = sanitizeObject(id);

  const tool = await Introduction.findById(cleanId);
  if (!tool) {
    return next(new ErrorHandler("Tool not found", 404));
  }

  const iconPublicId = tool.icon?.public_id;

  await tool.deleteOne();

  await redis.del("all-introductions");

  if (iconPublicId) {
    await cloudinary.uploader.destroy(iconPublicId);
  }

  res.status(200).json({
    success: true,
    message: "Tool deleted successfully",
  });
});
