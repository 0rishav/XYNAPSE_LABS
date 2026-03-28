import mongoose from "mongoose";
import TestCase from "../models/testCaseModal.js";
import Problem from "../models/problemModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { sanitizeObject } from "../../../../packages/common/src/utils/sanitizeInput.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";

export const createTestCase = CatchAsyncError(async (req, res, next) => {
  const sanitized = sanitizeObject(req.body, {
    problem: "string",
    input: "string",
    expectedOutput: "string",
    explanation: "string",
    timeLimit: "number",
    memoryLimit: "number",
    order: "number",
    tags: "array",
    isVisible: "boolean",
    status: "string",
  });

  const {
    problem,
    input,
    expectedOutput,
    explanation,
    timeLimit,
    memoryLimit,
    order,
    tags,
    isVisible,
    status,
  } = sanitized;

  if (!problem || !mongoose.Types.ObjectId.isValid(problem)) {
    return next(new ErrorHandler("Valid Problem ID is required", 400));
  }

  if (!input || !expectedOutput) {
    return next(new ErrorHandler("Input and Output are required", 400));
  }

  const allowedStatus = ["active", "inactive"];
  if (status && !allowedStatus.includes(status)) {
    return next(new ErrorHandler("Invalid status value", 400));
  }

  const testCase = await TestCase.create({
    problem,
    input,
    expectedOutput,
    explanation: explanation?.trim() || "",
    timeLimit: timeLimit ?? null,
    memoryLimit: memoryLimit ?? null,
    order: order ?? 0,
    tags: Array.isArray(tags) ? tags : [],
    isVisible: isVisible ?? false,
    status: status || "active",
  });

  await Problem.findByIdAndUpdate(problem, {
    $push: { testCases: testCase._id }
  });

  res.status(201).json({
    success: true,
    message: "Test case created successfully",
    testCase,
  });
});


export const getTestCasesByProblemId = CatchAsyncError(
  async (req, res, next) => {
    const { problemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return next(new ErrorHandler("Invalid Problem ID", 400));
    }

    const cacheKey = `testcases:problem:${problemId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Test cases fetched from cache",
        testCases: cached,
      });
    }

    const testCases = await TestCase.find({
      problem: problemId,
      status: "active",
    })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v")
      .lean();

    await redis.set(cacheKey, testCases, { ex: 60 * 60 });

    res.status(200).json({
      success: true,
      message: "Test cases fetched from DB",
      testCases,
    });
  }
);

export const getAllTestCases = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid Problem ID", 400));
  }

  const cacheKey = `testcases:problem:${problemId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Test cases fetched from cache",
      testCases: cached,
    });
  }

  const testCases = await TestCase.find({ problem: problemId })
    .sort({ order: 1, createdAt: 1 }) 
    .lean();

  await redis.set(cacheKey, testCases, { ex: 60 * 60 }); 

  res.status(200).json({
    success: true,
    message: "Test cases fetched successfully",
    testCases,
  });
});

export const updateTestCase = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid TestCase ID", 400));
  }

  const testCase = await TestCase.findById(id);
  if (!testCase) {
    return next(new ErrorHandler("TestCase not found", 404));
  }

  const sanitized = sanitizeObject(req.body, {
    input: "string",
    expectedOutput: "string",
    explanation: "string",
    isVisible: "boolean",
    timeLimit: "number",
    memoryLimit: "number",
    order: "number",
    tags: "array",
    status: "string",
  });

  if (sanitized.status && !["active", "inactive"].includes(sanitized.status)) {
    return next(new ErrorHandler("Invalid status value", 400));
  }

  Object.assign(testCase, sanitized);
  await testCase.save();

  await redis.del(`testcases:problem:${testCase.problem}`);

  res.status(200).json({
    success: true,
    message: "TestCase updated successfully",
    testCase,
  });
});

export const deleteTestCase = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid TestCase ID", 400));
  }

  const testCase = await TestCase.findById(id);
  if (!testCase) {
    return next(new ErrorHandler("TestCase not found", 404));
  }

  await TestCase.findByIdAndDelete(id);

  await redis.del(`testcases:problem:${testCase.problem}`);

  res.status(200).json({
    success: true,
    message: "TestCase deleted successfully",
  });
});

export const getVisibleTestCases = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid Problem ID", 400));
  }

  const cacheKey = `testcases:visible:${problemId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      message: "Visible test cases fetched from cache",
      testCases: cached,
    });
  }

  const testCases = await TestCase.find({
    problem: problemId,
    isVisible: true,
    status: "active",
  })
    .sort({ order: 1 })
    .lean();

  await redis.set(cacheKey, testCases, { ex: 60 * 60 });

  res.status(200).json({
    success: true,
    message: "Visible test cases fetched successfully",
    testCases,
  });
});

export const bulkUploadTestCases = CatchAsyncError(async (req, res, next) => {
  const { problemId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Invalid Problem ID", 400));
  }

  const testCases = req.body;

  if (!Array.isArray(testCases) || testCases.length === 0) {
    return next(new ErrorHandler("No test cases provided", 400));
  }

  const validTestCases = testCases.filter((tc, index) => {
    if (
      typeof tc.input !== "string" ||
      typeof tc.expectedOutput !== "string"
    ) {
      console.warn(`Skipping invalid testcase at index ${index}`);
      return false;
    }
    return true;
  });

  if (validTestCases.length === 0) {
    return next(new ErrorHandler("No valid test cases to upload", 400));
  }

  const formatted = validTestCases.map((tc) => ({
    problem: problemId,
    input: tc.input.trim(),
    expectedOutput: tc.expectedOutput.trim(),
    explanation: tc.explanation?.trim() || "",
    isVisible: tc.isVisible ?? false,
    order: tc.order ?? 0,
    timeLimit: tc.timeLimit ?? null,
    memoryLimit: tc.memoryLimit ?? null,
    tags: tc.tags ?? [],
    status: "active",
  }));

  const inserted = await TestCase.insertMany(formatted, { ordered: false });

  await Problem.findByIdAndUpdate(problemId, {
    $push: {
      testCases: { $each: inserted.map((tc) => tc._id) },
    },
  });

  await redis.del(`testcases:problem:${problemId}`);
  await redis.del(`testcases:visible:${problemId}`);

  res.status(201).json({
    success: true,
    message: `${inserted.length} test cases uploaded successfully`,
  });
});


export const bulkDeleteTestCases = CatchAsyncError(async (req, res, next) => {
  const { problemId, ids } = req.body || {};

  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    return next(new ErrorHandler("Valid Problem ID is required", 400));
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler("No testCase IDs provided", 400));
  }

  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    return next(new ErrorHandler("No valid testCase IDs provided", 400));
  }

  // Ensure the problem exists
  const problem = await Problem.findById(problemId).select("_id");
  if (!problem) {
    return next(new ErrorHandler("Problem not found", 404));
  }

  // Delete only testcases that belong to this problem
  const deleteResult = await TestCase.deleteMany({
    _id: { $in: validIds },
    problem: problemId,
  });

  // Pull deleted IDs from Problem.testCases
  await Problem.updateOne(
    { _id: problemId },
    { $pull: { testCases: { $in: validIds } } }
  );

  // Invalidate caches
  await redis.del(`testcases:problem:${problemId}`);
  await redis.del(`testcases:visible:${problemId}`);

  return res.status(200).json({
    success: true,
    message: `Deleted ${deleteResult.deletedCount || 0} test cases`,
    deletedCount: deleteResult.deletedCount || 0,
  });
});

