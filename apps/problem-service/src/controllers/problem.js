import mongoose from "mongoose";
import Problem from "../models/problemModal.js";
import fs from "fs";
// import Submission from "../models/submissionModal.js";
// import User from "../models/userModal.js";
import Lab from "../models/labModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { redisDelPattern } from "../../../../packages/common/src/infra/redisDel.js";
import User from "../../../identity-service/src/models/userModal.js";

export const createProblem = CatchAsyncError(async (req, res, next) => {
  const body = sanitizeObject(req.body, {
    lab: "string",
    labSection: "string",
    category: "string",
    title: "string",
    slug: "string?",
    description: "string",
    inputDescription: "string?",
    outputDescription: "string?",
    constraints: "string?",
    difficulty: "string",
    tags: "string[]?",
    starterCode: "object?",
    solutionCode: "object?",
    mainCodeTemplate: "object?",
    testCases: "object?",
    timeLimit: "number?",
    memoryLimit: "number?",
    isActive: "boolean?",
    isPremium: "boolean?",
    figmaUrl: "string?",
    expectedUIComponents: "string[]?",
    viewportWidth: "number?",
    viewportHeight: "number?",
    starterProjectStructure: "object?",
    starterFilesVisible: "string[]?",
    hints: "object[]?",
    notes: "object[]?",
    brief: "string?",
  });

  const {
    lab,
    labSection,
    category,
    title,
    slug,
    description,
    inputDescription,
    outputDescription,
    constraints,
    difficulty,
    starterCode = {},
    solutionCode = {},
    mainCodeTemplate = {},
    testCases = [],
    tags = [],
    timeLimit = 1000,
    memoryLimit = 256,
    isActive = true,
    isPremium = false,
    figmaUrl,
    expectedUIComponents,
    viewportWidth,
    viewportHeight,
    starterProjectStructure,
    starterFilesVisible,
    hints = [],
    notes = [],
    brief = "",
  } = body;

  let referenceImages = [];

  try {
    const requiredIds = [lab, labSection, category];
    if (requiredIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return next(new ErrorHandler("Invalid Lab/Section/Category ID", 400));
    }

    const difficultyLevels = ["easy", "medium", "hard"];
    if (!difficultyLevels.includes(difficulty)) {
      return next(new ErrorHandler("Invalid difficulty level", 400));
    }

    const generatedSlug =
      slug?.toLowerCase().replace(/\s+/g, "-") ??
      title.toLowerCase().trim().replace(/\s+/g, "-");

    const existing = await Problem.findOne({ slug: generatedSlug });
    if (existing) {
      return next(
        new ErrorHandler("Problem with same slug already exists", 409),
      );
    }

    const labDoc = await Lab.findById(lab);
    if (!labDoc) return next(new ErrorHandler("Lab not found", 404));

    const labType = labDoc.labType;

    if (labType === "Frontend") {
      const missing = [];

      if (!figmaUrl) missing.push("figmaUrl");
      if (!expectedUIComponents?.length) missing.push("expectedUIComponents");
      if (!viewportWidth) missing.push("viewportWidth");
      if (!viewportHeight) missing.push("viewportHeight");
      if (!starterProjectStructure) missing.push("starterProjectStructure");
      if (!starterFilesVisible?.length) missing.push("starterFilesVisible");
      // 👇 Removed this line
      // if (!req.files?.length) missing.push("referenceImages");

      if (missing.length) {
        return next(
          new ErrorHandler(
            `Missing required frontend fields: ${missing.join(", ")}`,
            400,
          ),
        );
      }

      if (req.files?.length) {
        try {
          const uploadResults = await Promise.all(
            req.files.map(async (file) => {
              const uploaded = await cloudinary.uploader.upload(file.path, {
                folder: "codexus/frontend-reference-images",
              });
              return uploaded.secure_url;
            }),
          );

          referenceImages = uploadResults;
        } catch (err) {
          return next(
            new ErrorHandler("Image upload to Cloudinary failed", 500),
          );
        }
      }
    }

    const parsedSolutionCode = new Map();

    if (solutionCode && typeof solutionCode === "object") {
      for (const [lang, solutions] of Object.entries(solutionCode)) {
        if (Array.isArray(solutions)) {
          parsedSolutionCode.set(
            lang,
            solutions.map((s) => ({
              title: s.title?.trim() ?? "Untitled Solution",
              explanation: s.explanation?.trim() ?? "",
              code: s.code?.trim() ?? "",
              author: req.user._id,
              createdAt: new Date(),
            })),
          );
        }
      }
    }

    const newProblem = await Problem.create({
      lab,
      labSection,
      category,
      title: title.trim(),
      slug: generatedSlug,
      description: description.trim(),
      inputDescription,
      outputDescription,
      constraints,
      difficulty,
      starterCode,
      solutionCode: parsedSolutionCode,
      mainCodeTemplate,
      testCases,
      tags: tags.map((tag) => tag.trim()),
      timeLimit,
      memoryLimit,
      isActive,
      isPremium,
      author: req.user._id,
      figmaUrl,
      expectedUIComponents,
      viewportWidth,
      viewportHeight,
      starterProjectStructure,
      starterFilesVisible,
      referenceImages,
      hints,
      notes,
      brief: brief?.trim(),
    });

    await redis.del(`problems:lab:${lab}`);
    await redis.del(`problems:section:${labSection}`);

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      problem: newProblem,
    });
  } finally {
    if (req.files?.length) {
      for (const file of req.files) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Failed to delete file:", file.path, err);
        });
      }
    }
  }
});

export const getProblemsWithStatus = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;

  let {
    page = 1,
    limit = 10,
    search = "",
    lab,
    labSection,
    category,
    difficulty,
    status = "",
    isActive,
    isPremium,
    sort = "createdAt",
  } = req.query;

  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Number(limit), 100);
  const skip = (pageNumber - 1) * pageSize;

  const baseFilters = {};
  if (search) baseFilters.title = { $regex: search.trim(), $options: "i" };
  if (lab && mongoose.Types.ObjectId.isValid(lab)) baseFilters.lab = lab;
  if (labSection && mongoose.Types.ObjectId.isValid(labSection))
    baseFilters.labSection = labSection;
  if (category && mongoose.Types.ObjectId.isValid(category))
    baseFilters.category = category;
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty))
    baseFilters.difficulty = difficulty;
  if (isActive !== undefined) baseFilters.isActive = isActive === "true";
  if (isPremium !== undefined) baseFilters.isPremium = isPremium === "true";

  const user = await User.findById(userId).select("solvedProblems").lean();
  const solvedIds = new Set(
    (user?.solvedProblems || []).map((id) => id.toString()),
  );
  const attemptedIdsRaw = await Submission.distinct("problem", {
    user: userId,
  });
  const attemptedIdsSet = new Set(attemptedIdsRaw.map((id) => id.toString()));

  const statusFilter = {};
  if (status === "solved") statusFilter._id = { $in: Array.from(solvedIds) };
  else if (status === "attempted")
    statusFilter._id = {
      $in: Array.from([...attemptedIdsSet].filter((id) => !solvedIds.has(id))),
    };
  else if (status === "unattempted") {
    const excluded = new Set([...solvedIds, ...attemptedIdsSet]);
    statusFilter._id = { $nin: Array.from(excluded) };
  }

  const filters = Object.keys(statusFilter).length
    ? { ...baseFilters, ...statusFilter }
    : baseFilters;

  const totalMatching = await Problem.countDocuments(filters);

  const problems = await Problem.find(filters)
    .sort(sort.startsWith("-") ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
    .skip(skip)
    .limit(pageSize)
    .populate("lab", "name slug")
    .lean();

  const ACCESS_HIERARCHY = {
    free: ["free"],
    standard: ["free", "standard"],
    premium: ["free", "standard", "premium"],
  };
  const allowedAccessLevels = ACCESS_HIERARCHY[req.accessLevel || "free"];
  const purchasedLabIds = Array.isArray(req.purchasedLabIds)
    ? req.purchasedLabIds.map((x) => x.toString())
    : [];
  const isPaidUser = Boolean(req.isPaidUser);

  const withStatusAndAccess = problems.map((p) => {
    const id = p._id.toString();
    let st = "unattempted";
    if (solvedIds.has(id)) st = "solved";
    else if (attemptedIdsSet.has(id)) st = "attempted";

    const labIdStr = p?.lab?._id ? p.lab._id.toString() : null;

    const canAccess =
      p.accessLevel === "free" ||
      (isPaidUser &&
        labIdStr &&
        purchasedLabIds.includes(labIdStr) &&
        allowedAccessLevels.includes(p.accessLevel));

    return canAccess
      ? { ...p, status: st, isLocked: false }
      : {
          _id: p._id,
          title: p.title,
          difficulty: p.difficulty,
          lab: p.lab || null,
          status: st,
          accessLevel: p.accessLevel,
          isLocked: true,
        };
  });

  return res.status(200).json({
    success: true,
    page: pageNumber,
    limit: pageSize,
    total: totalMatching,
    problems: withStatusAndAccess,
  });
});

export const updateProblem = CatchAsyncError(async (req, res, next) => {
  const problemId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return next(new ErrorHandler("Invalid problem ID", 400));
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return next(new ErrorHandler("Problem not found", 404));
    }

    // 🔹 Include accessLevel in sanitizeObject
    const body = sanitizeObject(req.body, {
      lab: "string?",
      labSection: "string?",
      category: "string?",
      title: "string?",
      slug: "string?",
      description: "string?",
      inputDescription: "string?",
      outputDescription: "string?",
      constraints: "string?",
      difficulty: "string?",
      allowedOptions: "object?",
      starterCode: "object?",
      solutionCode: "object?",
      testCases: "object?",
      tags: "string[]?",
      timeLimit: "number?",
      memoryLimit: "number?",
      isActive: "boolean?",
      isPremium: "boolean?",
      accessLevel: "string?", // 🔹 added here
      mainCodeTemplate: "object?",
      starterProjectStructure: "object?",
      starterFilesVisible: "string[]?",
      figmaUrl: "string?",
      expectedUIComponents: "object?",
    });

    // Validate object IDs
    const objectIdFields = ["lab", "labSection", "category"];
    for (const field of objectIdFields) {
      if (body[field] && !mongoose.Types.ObjectId.isValid(body[field])) {
        return next(new ErrorHandler(`Invalid ${field} ID`, 400));
      }
    }

    // Validate difficulty
    if (body.difficulty) {
      const levels = ["easy", "medium", "hard"];
      if (!levels.includes(body.difficulty)) {
        return next(new ErrorHandler("Invalid difficulty level", 400));
      }
    }

    // Validate accessLevel if provided
    if (body.accessLevel) {
      const levels = ["free", "standard", "premium"];
      if (!levels.includes(body.accessLevel)) {
        return next(new ErrorHandler("Invalid accessLevel value", 400));
      }
    }

    const labId = body.lab || problem.lab;
    const lab = await Lab.findById(labId);
    if (!lab) {
      return next(new ErrorHandler("Associated lab not found", 404));
    }

    // Validate allowedOptions languages
    if (body.allowedOptions) {
      const validLangs = new Set(lab.labType);
      for (const lang of Object.keys(body.allowedOptions)) {
        if (!validLangs.has(lang)) {
          return next(
            new ErrorHandler(
              `Invalid language in allowedOptions: ${lang}`,
              400,
            ),
          );
        }
      }
    }

    // Generate slug if title updated
    if (body.title && !body.slug) {
      body.slug = body.title.toLowerCase().trim().replace(/\s+/g, "-");
    }

    if (body.slug) {
      const existing = await Problem.findOne({
        slug: body.slug,
        _id: { $ne: problemId },
      });
      if (existing) {
        return next(new ErrorHandler("Slug already in use", 409));
      }
    }

    // Frontend referenceImages
    let newReferenceImages = [];
    if (lab.labType === "Frontend" && req.files?.referenceImages) {
      const files = Array.isArray(req.files.referenceImages)
        ? req.files.referenceImages
        : [req.files.referenceImages];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "codexus/problems/referenceImages",
        });
        newReferenceImages.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    // Parse solutionCode
    if (body.solutionCode && typeof body.solutionCode === "object") {
      const parsedSolutionCode = new Map();

      for (const [lang, solutions] of Object.entries(body.solutionCode)) {
        if (Array.isArray(solutions)) {
          parsedSolutionCode.set(
            lang,
            solutions.map((s) => ({
              title: s.title?.trim() ?? "Untitled Solution",
              explanation: s.explanation?.trim() ?? "",
              code: s.code?.trim() ?? "",
              author: s.author ?? req.user._id,
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            })),
          );
        }
      }

      problem.solutionCode = parsedSolutionCode;
      delete body.solutionCode;
    }

    Object.assign(problem, {
      ...body,
      tags: body.tags?.map((tag) => tag.trim()) ?? problem.tags,
    });

    if (lab.labType === "Frontend" && newReferenceImages.length > 0) {
      problem.referenceImages = newReferenceImages;
    }

    problem.updatedAt = new Date();
    await problem.save();

    await redis.del(`problems:lab:${problem.lab}`);
    await redis.del(`problems:section:${problem.labSection}`);

    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      problem,
    });
  } finally {
    const filesToDelete = [];
    if (Array.isArray(req.files)) {
      filesToDelete.push(...req.files);
    } else if (typeof req.files === "object") {
      for (const field in req.files) {
        const fileEntry = req.files[field];
        if (Array.isArray(fileEntry)) {
          filesToDelete.push(...fileEntry);
        } else {
          filesToDelete.push(fileEntry);
        }
      }
    }
    for (const file of filesToDelete) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Failed to delete file:", file.path, err);
      });
    }
  }
});

export const getProblemById = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(problemId)
    .populate("lab", "name slug labType")
    .populate("labSection", "title slug")
    .populate("category", "name slug")
    .populate("testCases")
    .populate("author", "name email")
    .lean();

  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  const isFree = problem.accessLevel === "free";
  const userHasAccess =
    req.isPaidUser &&
    ((problem.accessLevel === "standard" &&
      ["standard", "premium"].includes(req.accessLevel)) ||
      (problem.accessLevel === "premium" && req.accessLevel === "premium"));

  let responseProblem;

  if (isFree || userHasAccess) {
    responseProblem = problem;
    responseProblem.isLocked = false;
  } else {
    responseProblem = {
      _id: problem._id,
      title: problem.title,
      difficulty: problem.difficulty,
      accessLevel: problem.accessLevel,
      isLocked: true,
    };
  }

  res.status(200).json({
    success: true,
    message: "Problem fetched successfully",
    problem: responseProblem,
  });
});

export const getAllProblems = CatchAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 6,
    search = "",
    lab,
    labSection,
    category,
    difficulty,
    isActive,
    sort = "createdAt",
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Number(limit) || 6, 100);
  const skip = (pageNumber - 1) * pageSize;

  // Filters initialization
  const filters = {};
  if (search) filters.title = { $regex: search.trim(), $options: "i" };
  if (lab && mongoose.Types.ObjectId.isValid(lab)) filters.lab = lab;
  if (labSection && mongoose.Types.ObjectId.isValid(labSection))
    filters.labSection = labSection;
  if (category && mongoose.Types.ObjectId.isValid(category))
    filters.category = category;
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty))
    filters.difficulty = difficulty;
  if (isActive !== undefined) filters.isActive = isActive === "true";

  const total = await Problem.countDocuments(filters);

  const problems = await Problem.find(filters)
    .sort(sort.startsWith("-") ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
    .skip(skip)
    .limit(pageSize)
    .lean()
    .populate("lab", "name slug");

  const ACCESS_HIERARCHY = {
    free: ["free"],
    standard: ["free", "standard"],
    premium: ["free", "standard", "premium"],
  };
  const userAccessLevel = req.accessLevel || "free";
  const allowedAccessLevels = ACCESS_HIERARCHY[userAccessLevel];

  const processedProblems = problems.map((problem) => {
    const canAccess =
      problem.accessLevel === "free" ||
      (req.isPaidUser &&
        req.purchasedLabIds &&
        req.purchasedLabIds.includes(problem.lab._id.toString()) &&
        allowedAccessLevels.includes(problem.accessLevel));

    if (canAccess) {
      return { ...problem, isLocked: false };
    } else {
      return {
        _id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        lab: problem.lab,
        accessLevel: problem.accessLevel,
        isLocked: true,
      };
    }
  });

  res.status(200).json({
    success: true,
    message: "Problems fetched successfully",
    total,
    page: pageNumber,
    limit: pageSize,
    problems: processedProblems,
  });
});

export const getProblemBrief = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(problemId)
    .select("title difficulty lab slug isActive")
    .populate("lab", "name")
    .lean();

  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  const payload = {
    problemId: problem._id,
    labId: problem.lab?._id || null,
    labName: problem.lab?.name || null,
    title: problem.title,
    difficulty: problem.difficulty,
    slug: problem.slug,
    isActive: problem.isActive,
  };

  return res.status(200).json({ success: true, problem: payload });
});

export const getProblemOfTheDay = CatchAsyncError(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const cacheKey = `problem:potd:${dateKey}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Problem of the Day (cached)",
      problem: cached,
    });
  }

  const sampled = await Problem.aggregate([
    { $match: { isActive: true } },
    { $sample: { size: 1 } },
  ]);

  if (!sampled || sampled.length === 0) {
    return next(
      new ErrorHandler(
        "No active problems available for Problem of the Day",
        404,
      ),
    );
  }

  const problemId = sampled[0]._id;
  const problem = await Problem.findById(problemId)
    .populate("lab", "name slug labType")
    .populate("labSection", "title slug")
    .populate("category", "name slug")
    .lean();

  const endOfDay = new Date();
  endOfDay.setHours(24, 0, 0, 0);
  const ttlSeconds = Math.max(
    1,
    Math.floor((endOfDay.getTime() - Date.now()) / 1000),
  );

  await redis.set(cacheKey, problem, { ex: ttlSeconds });

  return res
    .status(200)
    .json({ success: true, message: "Problem of the Day", problem });
});

export const deleteProblem = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid Problem ID", 400));
  }

  const problem = await Problem.findById(problemId);
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  await problem.deleteOne();

  await redis.del(`problem:${problemId}`);
  await redisDelPattern("problems:*");

  res.status(200).json({
    success: true,
    message: "Problem deleted successfully",
  });
});

export const getProblemsByCategory = CatchAsyncError(async (req, res, next) => {
  const { categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return next(new ErrorHandler("Invalid Category ID", 400));
  }

  const cacheKey = `problems:category:${categoryId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Problems fetched from cache",
      problems: cached,
    });
  }

  const problems = await Problem.find({
    category: categoryId,
    isActive: true,
  })
    .select("title slug difficulty tags lab labSection createdAt updatedAt")
    .sort({ createdAt: -1 })
    .populate("lab", "name slug")
    .populate("labSection", "title slug")
    .lean();

  await redis.set(cacheKey, problems, { ex: 60 * 60 });

  return res.status(200).json({
    success: true,
    message: "Problems fetched successfully",
    problems,
  });
});

export const toggleProblemStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Problem ID", 400));
  }

  const problem = await Problem.findById(id);
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  problem.isActive = !problem.isActive;
  await problem.save();

  await redis.del(`problem:${id}`);
  await redis.del(`problems:category:${problem.category}`);
  await redis.del(`problems:labSection:${problem.labSection}`);

  return res.status(200).json({
    success: true,
    message: `Problem ${
      problem.isActive ? "enabled" : "disabled"
    } successfully`,
    status: problem.isActive,
  });
});

export const likeProblem = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const updated = await Problem.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true },
  );

  if (!updated) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Problem liked",
    likes: updated.likes,
  });
});

export const dislikeProblem = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const updated = await Problem.findByIdAndUpdate(
    id,
    { $inc: { dislikes: 1 } },
    { new: true },
  );

  if (!updated) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Problem disliked",
    dislikes: updated.dislikes,
  });
});

export const getCodeByLang = CatchAsyncError(async (req, res, next) => {
  const { id, lang } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(id).select("starterCode solutionCode");
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  const starter = problem.starterCode?.get(lang) || null;
  const solutions = problem.solutionCode?.get(lang) || [];

  res.status(200).json({
    success: true,
    starterCode: starter,
    solutionCode: solutions,
  });
});

export const updateCodeByLang = CatchAsyncError(async (req, res, next) => {
  const { id, lang } = req.params;
  const { starterCode, solutionCode } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(id);
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  if (starterCode !== undefined) {
    problem.starterCode.set(lang, starterCode);
  }

  if (Array.isArray(solutionCode)) {
    for (const sol of solutionCode) {
      if (!sol.title || !sol.code) {
        return next(
          new ErrorHandler("Each solution must include title and code", 400),
        );
      }
    }
    problem.solutionCode.set(lang, solutionCode);
  }

  await problem.save();

  res.status(200).json({
    success: true,
    message: "Code updated successfully",
  });
});

export const getMainCodeTemplate = CatchAsyncError(async (req, res, next) => {
  const { id, lang } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(id).select("mainCodeTemplate");
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  const template = problem.mainCodeTemplate?.get(lang) || null;

  res.status(200).json({
    success: true,
    mainCodeTemplate: template,
  });
});

export const getProblemFiles = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  const problem = await Problem.findById(id).select(
    "starterProjectStructure starterFilesVisible",
  );
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  res.status(200).json({
    success: true,
    starterProjectStructure: problem.starterProjectStructure,
    starterFilesVisible: problem.starterFilesVisible,
  });
});

export const updateProblemFileStructure = CatchAsyncError(
  async (req, res, next) => {
    const { id } = req.params;
    const { starterProjectStructure } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid problem ID", 400));
    }

    if (
      !starterProjectStructure ||
      typeof starterProjectStructure !== "object"
    ) {
      return next(
        new ErrorHandler("starterProjectStructure must be an object", 400),
      );
    }

    const problem = await Problem.findById(id);
    if (!problem) {
      return next(new ErrorHandler("Problem not found", 404));
    }

    problem.starterProjectStructure = starterProjectStructure;

    await problem.save();

    res.status(200).json({
      success: true,
      message: "Starter project structure updated successfully",
    });
  },
);

export const updateVisibleFiles = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { visibleFiles } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid problem ID", 400));
  }

  if (!Array.isArray(visibleFiles)) {
    return next(
      new ErrorHandler("visibleFiles must be an array of strings", 400),
    );
  }

  const problem = await Problem.findById(id);
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  problem.starterFilesVisible = visibleFiles;

  await problem.save();

  res.status(200).json({
    success: true,
    message: "Visible files updated successfully",
  });
});

// const OUTPUT_CHARACTER_LIMIT = 1000;
