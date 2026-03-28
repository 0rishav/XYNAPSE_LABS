// import { CatchAsyncError } from "../middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";
import { Project } from "../models/projectModal.js";
import slugify from "slugify";

export const createProject = CatchAsyncError(async (req, res, next) => {
  
  const schema = {
    title: "string",
    description: "string",
    priority: "string",
    status: "string",
    estimatedHours: "number",
    actualHours: "number",
    startDate: "string",
    endDate: "string",
    tags: "string",
  };

  const sanitizedData = sanitizeObject(req.body, schema);

  if (!sanitizedData.title || !sanitizedData.description) {
    return next(new ErrorHandler("Title and Description are required", 400));
  }

  const slug = slugify(sanitizedData.title, { lower: true, strict: true });

  const payload = {
    ...sanitizedData,
    slug,
    startDate: new Date(sanitizedData.startDate),
    endDate: new Date(sanitizedData.endDate),
    user: req.user._id,
  };

  const project = await Project.create(payload);

  await redis.set(`project:${project._id}`, project, {
    ex: 3600,
  });

  res.status(201).json({
    success: true,
    message: "Project created !!",
    project,
  });
});

export const updateProject = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const existingProject = await Project.findById(id);
  if (!existingProject || existingProject.isDeleted) {
    return next(new ErrorHandler("Project not found", 404));
  }

  const schema = {
    title: "string",
    description: "string",
    priority: "string",
    status: "string",
    estimatedHours: "number",
    actualHours: "number",
    startDate: "string",
    endDate: "string",
    tags: "string",
  };

  const sanitizedData = sanitizeObject(req.body, schema);

  if (sanitizedData.title) {
    sanitizedData.slug = slugify(sanitizedData.title, {
      lower: true,
      strict: true,
    });
  }

  if (sanitizedData.startDate) {
    sanitizedData.startDate = new Date(sanitizedData.startDate);
  }
  if (sanitizedData.endDate) {
    sanitizedData.endDate = new Date(sanitizedData.endDate);
  }

  const updatedProject = await Project.findByIdAndUpdate(id, sanitizedData, {
    new: true,
    runValidators: true,
  });

  await redis.set(`project:${updatedProject._id}`, updatedProject, {
    ex: 3600,
  });

  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    project: updatedProject,
  });
});

export const getAllProjects = CatchAsyncError(async (req, res, next) => {
  let {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search = "",
    priority,
    status,
    tags,
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const skip = (page - 1) * limit;

  const query = { isDeleted: false, user: req.user._id };
  if (search) query.title = { $regex: search.trim(), $options: "i" };
  if (priority) query.priority = priority;
  if (status) query.status = status;
  if (tags) {
    const tagsArray = tags.split(",").map((t) => t.trim().toLowerCase());
    query.tags = { $in: tagsArray };
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  // 🔹 Redis cache key (abhi use nahi ho raha)
  /*
  const rawKey = JSON.stringify({
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    priority,
    status,
    tags,
  });
  const hashKey = crypto.createHash("md5").update(rawKey).digest("hex");
  const redisKey = `projects:list:${hashKey}`;

  const cached = await redis.get(redisKey);
  if (cached) {
    return res.status(200).json(cached);
  }
  */

  // 🔹 Direct DB fetch
  const totalProjects = await Project.countDocuments(query);
  const projects = await Project.find(query).sort(sort).skip(skip).limit(limit);

  const response = {
    success: true,
    message: "Project Fetch !!",
    totalProjects,
    currentPage: page,
    totalPages: Math.ceil(totalProjects / limit),
    projects,
  };

  // 🔹 Cache set (abhi comment kar diya)
  // await redis.set(redisKey, response, { ex: 600 });

  res.status(200).json(response);
});

export const getProjectById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const redisKey = `project:${id}`;

  const cachedProject = await redis.get(redisKey);
  if (cachedProject) {
    return res.status(200).json({
      success: true,
      project: cachedProject,
    });
  }

  const project = await Project.findOne({ _id: id, isDeleted: false });

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  await redis.set(redisKey, project, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: "Project Fetch With Id !!",
    project,
  });
});

export const deleteProject = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findOne({ _id: id, isDeleted: false });

  if (!project) {
    return next(new ErrorHandler("Project not found or already deleted", 404));
  }

  project.isDeleted = true;
  await project.save();

  await redis.del(`project:${id}`);
  // await redis.delPattern("projects:list:*");

  res.status(200).json({
    success: true,
    message: "Project deleted successfully (soft delete)",
  });
});

export const restoreProject = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findOne({ _id: id, isDeleted: true });

  if (!project) {
    return next(new ErrorHandler("Project not found or already active", 404));
  }

  project.isDeleted = false;
  await project.save();

  await redis.del(`project:${id}`);
  await redis.delPattern("projects:list:*");

  res.status(200).json({
    success: true,
    message: "Project restored !!",
    project,
  });
});

export const hardDeleteProject = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return next(new ErrorHandler("Project not found", 404));
  }

  await Project.deleteOne({ _id: id });

  await redis.del(`project:${id}`);
  await redis.delPattern("projects:list:*");

  res.status(200).json({
    success: true,
    message: "Project permanently deleted from database !!",
  });
});

export const updateProjectStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["Planning", "In Progress", "Completed", "On Hold"];

  if (!status || !allowedStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid or missing status value", 400));
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { status },
    { new: true }
  );

  if (!project) {
    return next(new ErrorHandler("Project not found or has been deleted", 404));
  }

  await redis.del(`project:${id}`);

  res.status(200).json({
    success: true,
    message: "Project status updated !!",
    project,
  });
});

export const updateProjectProgress = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { progress } = req.body;

  const progressValue = parseFloat(progress);

  if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
    return next(
      new ErrorHandler("Progress must be a number between 0 and 100", 400)
    );
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { progress: progressValue },
    { new: true }
  );

  if (!project) {
    return next(new ErrorHandler("Project not found or has been deleted", 404));
  }

  await redis.del(`project:${id}`);

  res.status(200).json({
    success: true,
    message: "Project progress updated !!",
    project,
  });
});

export const getProjectStatsSummary = CatchAsyncError(
  async (req, res, next) => {
    const [total, perStatus, perPriority] = await Promise.all([
      Project.countDocuments({ isDeleted: false }),
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      message: "Project Status Summary !!",
      data: {
        totalProjects: total,
        projectsPerStatus: Object.fromEntries(
          perStatus.map((item) => [item._id, item.count])
        ),
        projectsPerPriority: Object.fromEntries(
          perPriority.map((item) => [item._id, item.count])
        ),
      },
    });
  }
);

export const getProjectProgressStats = CatchAsyncError(
  async (req, res, next) => {
    const progressBuckets = await Project.aggregate([
      { $match: { isDeleted: false } },
      {
        $bucket: {
          groupBy: "$progress",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Project Stats !!",
      data: {
        progressDistribution: Object.fromEntries(
          progressBuckets.map((b) => [`${b._id}`, b.count])
        ),
      },
    });
  }
);

export const getProjectHourStats = CatchAsyncError(async (req, res, next) => {
  const result = await Project.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalEstimatedHours: { $sum: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
      },
    },
  ]);

  const stats = result[0] || { totalEstimatedHours: 0, totalActualHours: 0 };

  res.status(200).json({
    success: true,
    message: "Project Hours Stats !!",
    data: {
      estimatedHours: stats.totalEstimatedHours,
      actualHours: stats.totalActualHours,
    },
  });
});
