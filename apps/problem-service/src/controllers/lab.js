import mongoose from "mongoose";
import Lab from "../models/labModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";
import {
  deleteFromCloudinary,
  deleteLocalFiles,
  uploadOnCloudinary,
} from "../../../../packages/common/src/infra/uploadOnCloudinary.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";

export const createLab = CatchAsyncError(async (req, res, next) => {
  const file = req.file;

  if (!file) {
    return next(new ErrorHandler("Lab icon is required", 400));
  }

  const sanitizedData = sanitizeObject(req.body, {
    title: "string",
    name: "string",
    description: "string",
    labType: "string",
    learningPoints: "array",
    labels: "array",
  });

  console.log(req.body);

  const { title, name, description, labType, learningPoints, labels } =
    sanitizedData;

  const allowedTypes = [
    "DSA",
    "Frontend",
    "Backend",
    "DevOps",
    "Database",
    "Microservices",
    "CICD",
    "Python",
    "System Design",
    "Data Science",
    "AIML",
    "pySpark",
  ];

  if (!allowedTypes.includes(labType)) {
    return next(new ErrorHandler("Invalid lab type", 400));
  }

  const allowedLabels = [
    "Hot",
    "Popular",
    "Career",
    "Advanced",
    "In Demand",
    "New",
  ];
  const validLabels = Array.isArray(labels)
    ? labels.map((l) => l.trim()).filter((l) => allowedLabels.includes(l))
    : [];

  const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "image/webp",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return next(new ErrorHandler("Invalid image type", 400));
  }

  let uploadedIcon = null;

  try {
    const existing = await Lab.findOne({ name: name.trim() });
    if (existing) {
      return next(new ErrorHandler("Lab with this name already exists", 400));
    }

    uploadedIcon = await uploadOnCloudinary(file.path);
    if (!uploadedIcon?.secure_url) {
      return next(new ErrorHandler("Icon upload failed", 500));
    }

    const newLab = await Lab.create({
      title: title?.trim(),
      name: name.trim(),
      description: description?.trim(),
      labType,
      learningPoints: Array.isArray(learningPoints)
        ? learningPoints.map((p) => p.trim()).filter(Boolean)
        : [],
      labels: validLabels,
      icon: {
        public_id: uploadedIcon.public_id,
        secure_url: uploadedIcon.secure_url,
      },
      createdBy: req.user._id,
    });

    await redis.del("labs:all");
    await redis.del("labs:hot");
    await redis.del("labs:popular");
    await redis.del("labs:advanced");

    return res.status(201).json({
      success: true,
      message: "Lab created !!",
      lab: newLab,
    });
  } catch (err) {
    if (uploadedIcon?.public_id) {
      await deleteFromCloudinary(uploadedIcon.public_id);
    }
    return next(new ErrorHandler(err.message || "Something went wrong", 500));
  } finally {
    if (file?.path) {
      deleteLocalFiles(file.path);
    }
  }
});

export const updateLab = CatchAsyncError(async (req, res, next) => {
  const labId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(labId)) {
    return next(new ErrorHandler("Invalid Lab ID", 400));
  }

  const lab = await Lab.findById(labId);
  if (!lab) {
    return next(new ErrorHandler("Lab not found", 404));
  }

  const sanitized = sanitizeObject(req.body, {
    title: "string",
    name: "string",
    description: "string",
    labType: "string",
    isActive: "boolean",
    availability: "string",
    learningPoints: "array",
    labels: "array",
  });

  const {
    title,
    name,
    description,
    labType,
    isActive,
    availability,
    learningPoints,
    labels,
  } = sanitized;

  const allowedLabTypes = [
    "DSA",
    "Frontend",
    "Backend",
    "DevOps",
    "Database",
    "Microservices",
    "CI/CD",
    "Python",
    "System Design",
    "Data Science",
  ];

  const allowedLabels = [
    "Hot",
    "Popular",
    "Career",
    "Advanced",
    "In Demand",
    "New",
  ];

  if (labType && !allowedLabTypes.includes(labType)) {
    return next(new ErrorHandler("Invalid lab type", 400));
  }

  if (labels && Array.isArray(labels)) {
    const invalid = labels.filter((lbl) => !allowedLabels.includes(lbl));
    if (invalid.length > 0) {
      return next(
        new ErrorHandler(`Invalid label(s): ${invalid.join(", ")}`, 400),
      );
    }
    lab.labels = labels;
  }

  if (req.file) {
    try {
      if (lab.icon?.public_id) {
        await deleteFromCloudinary(lab.icon.public_id);
      }

      const result = await uploadOnCloudinary(req.file.path);
      if (!result?.secure_url) {
        return next(new ErrorHandler("Image upload failed", 500));
      }

      lab.icon = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    } catch (uploadErr) {
      console.log(uploadErr.message);
      return next(new ErrorHandler("Image upload failed", 500));
    } finally {
      if (req.file?.path) {
        deleteLocalFiles(req.file.path);
      }
    }
  }

  if (title) lab.title = title.trim();
  if (name) lab.name = name.trim();
  if (description) lab.description = description.trim();
  if (labType) lab.labType = labType;
  if (typeof isActive === "boolean") lab.isActive = isActive;
  if (
    availability &&
    ["active", "inactive", "disabled"].includes(availability)
  ) {
    lab.availability = availability;
  }

  if (Array.isArray(learningPoints)) {
    lab.learningPoints = learningPoints.map((pt) => pt.trim()).filter(Boolean);
  }

  await lab.save();
  await redis.del("labs:all");
  await redis.del("labs:hot");
  await redis.del("labs:popular");
  await redis.del("labs:advanced");

  res.status(200).json({
    success: true,
    message: "Lab updated !!",
    lab,
  });
});

export const getAllLabs = CatchAsyncError(async (req, res, next) => {
  console.log("GET ALL LABS API HIT");

  let cached;

  // 🔹 Try Redis
  try {
    cached = await redis.get("labs:all");
  } catch (err) {
    console.error(" Redis GET Error:", err.message);
  }

  // 🔹 If cache exists
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Labs fetched from cache",
      labs: JSON.parse(cached), // ✅ MUST parse
    });
  }

  // 🔹 Fetch from DB
  const labs = await Lab.find({ isActive: true })
    .select(
      "name description learningPoints labels labType icon slug createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  // 🔹 Store in Redis safely
  try {
    await redis.set("labs:all", JSON.stringify(labs), { EX: 3600 }); // 1 hour cache
  } catch (err) {
    console.error(" Redis SET Error:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Labs fetched from DB",
    labs,
  });
});

export const getHotLabs = CatchAsyncError(async (req, res, next) => {
  console.log(" HOT LABS API HIT");

  // 🔹 Try Redis cache first
  let cached;
  try {
    cached = await redis.get("labs:hot");
  } catch (err) {
    console.error("❌ Redis GET Error (hot labs):", err.message);
  }

  // 🔹 Return cache if exists
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Hot labs fetched from cache",
      labs: JSON.parse(cached), //  Parse JSON string
    });
  }

  // 🔹 Fetch from DB - labs with "Hot" label AND active
  const labs = await Lab.find({
    isActive: true,
    $or: [
      // Handle both string and array labels
      { labels: "Hot" },
      { labels: { $in: ["Hot"] } },
    ],
  })
    .select(
      "name description learningPoints labels labType icon slug createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  // 🔹 Cache for 1 hour
  try {
    await redis.set("labs:hot", JSON.stringify(labs), { EX: 3600 });
  } catch (err) {
    console.error("❌ Redis SET Error (hot labs):", err.message);
  }

  res.status(200).json({
    success: true,
    message: `Hot labs fetched from DB (${labs.length} found)`,
    labs,
  });
});

export const getPopularLabs = CatchAsyncError(async (req, res) => {
  const cached = await redis.get("labs:popular");

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Popular labs fetched from cache",
      labs: JSON.parse(cached), // FIXED: Parse JSON
    });
  }

  const labs = await Lab.find({
    isActive: true,
    $or: [{ labels: "Popular" }, { labels: { $in: ["Popular"] } }],
  })
    .select(
      "name description learningPoints labels labType icon slug createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  await redis.set("labs:popular", JSON.stringify(labs), { EX: 3600 }); // FIXED: Stringify

  res.status(200).json({
    success: true,
    message: "Popular labs fetched from DB",
    labs,
  });
});

export const getAdvancedLabs = CatchAsyncError(async (req, res) => {
  const cached = await redis.get("labs:advanced");

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Advanced labs fetched from cache",
      labs: JSON.parse(cached), //  FIXED: Parse JSON
    });
  }

  const labs = await Lab.find({
    isActive: true,
    $or: [{ labels: "Advanced" }, { labels: { $in: ["Advanced"] } }],
  })
    .select(
      "name description learningPoints labels labType icon slug createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .lean();

  await redis.set("labs:advanced", JSON.stringify(labs), { EX: 3600 }); //  FIXED: Stringify

  res.status(200).json({
    success: true,
    message: "Advanced labs fetched from DB", // FIXED: message
    labs,
  });
});

export const getLabById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Lab ID", 400));
  }

  const lab = await Lab.findById(id)
    .select(
      "name description labType icon slug learningPoints title labels isActive availability createdAt updatedAt",
    )
    .lean();

  if (!lab) {
    return next(new ErrorHandler("Lab not found", 404));
  }

  // Access gating by availability
  const role = req.user?.role;
  const isAdmin = role === "lab_admin" || role === "admin";
  if (!isAdmin) {
    if (lab.availability === "inactive") {
      return next(new ErrorHandler("Lab not found", 404));
    }
    // If disabled and not purchased, still return details to allow payment on landing page.
    // Content-level gating is enforced in respective endpoints.
  }

  res.status(200).json({
    success: true,
    message: "Lab fetched successfully",
    lab,
  });
});

export const deleteLab = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Lab ID", 400));
  }

  const lab = await Lab.findById(id);

  if (!lab) {
    return next(new ErrorHandler("Lab not found", 404));
  }
  if (lab.icon?.public_id) {
    try {
      await cloudinary.uploader.destroy(lab.icon.public_id);
    } catch (error) {
      console.error(error.message);
    }
  }

  await Lab.findByIdAndDelete(id);

  await redis.del("labs:all");
  await redis.del("labs:hot");
  await redis.del("labs:popular");
  await redis.del("labs:advanced");

  res.status(200).json({
    success: true,
    message: "Lab deleted successfully",
  });
});

export const getMinimalLabs = CatchAsyncError(async (req, res, next) => {
  const cacheKey = "labs:minimal";

  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Labs fetched from cache !!",
      data: JSON.parse(cached), //  FIXED: Parse JSON
    });
  }

  const labs = await Lab.find({}, { _id: 1, name: 1 }).lean();

  await redis.set(cacheKey, JSON.stringify(labs), { EX: 3600 }); // ✅ FIXED: Stringify

  res.status(200).json({
    success: true,
    message: "Labs fetched !!",
    data: labs,
  });
});
