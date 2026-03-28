import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import { validateFAQInput, validateFAQUpdate } from "../../../../packages/common/src/utils/validation.js";
import FAQ from "../models/faqModal.js";

export const createFAQ = CatchAsyncError(async (req, res, next) => {
  const { lab, labSection, question, answer, isActive } = req.body;

  const validationErrors = validateFAQInput({
    lab,
    labSection,
    question,
    answer,
    isActive,
  });

  if (Object.keys(validationErrors).length > 0) {
    return next(new ErrorHandler("Validation failed", 400, validationErrors));
  }

  const faq = await FAQ.create({
    lab,
    labSection,
    question: question.trim(),
    answer: answer.trim(),
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user?._id || null,
  });

  try {
    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache deletion failed:", error.message);
  }

  res.status(201).json({
    success: true,
    message: "FAQ created successfully",
    data: faq,
  });
});

export const updatedCode = async() => {
  console.log("This is a placeholder function.");
}

// export const updatedCodexuslab = async() => {
//   console.log("This is a placeholder function.");
// }

export const updateFAQ = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { question, answer, isActive } = req.body;

  const validationErrors = validateFAQUpdate({ question, answer, isActive });
  if (Object.keys(validationErrors).length > 0) {
    return next(new ErrorHandler("Validation failed", 400, validationErrors));
  }

  const faq = await FAQ.findById(id);
  if (!faq) {
    return next(new ErrorHandler("FAQ not found", 404));
  }

  if (question !== undefined) faq.question = question.trim();
  if (answer !== undefined) faq.answer = answer.trim();
  if (isActive !== undefined) faq.isActive = isActive;

  faq.updatedBy = req.user?._id || null;
  await faq.save();

  try {
    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del(`faq:detail:${id}`);
  } catch (error) {
    console.error("Redis cache deletion failed:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "FAQ updated successfully",
    data: faq,
  });
});

export const getAllFAQs = CatchAsyncError(async (req, res, next) => {
  const { lab, labSection, isActive, search, page = 1, limit = 10 } = req.query;

  // const cacheKey = `faqs:list:${JSON.stringify(req.query)}`;
  // const cached = await redis.get(cacheKey);
  // if (cached) {
  //   return res.status(200).json({
  //     success: true,
  //     message: "FAQs fetched from cache !!",
  //     ...cached,
  //   });
  // }

  const query = {};

  if (lab) query.lab = lab;
  if (labSection) query.labSection = labSection;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    query.question = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [faqs, total] = await Promise.all([
    FAQ.find(query)
      .populate("lab", "name")
      .populate("labSection", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    FAQ.countDocuments(query),
  ]);

  const response = {
    total,
    page: Number(page),
    limit: Number(limit),
    count: faqs.length,
    data: faqs,
  };

  // await redis.set(cacheKey, response, { ex: 600 });

  res.status(200).json({
    success: true,
    message: "FAQs fetched !!",
    ...response,
  });
});

export const getFAQById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const cacheKey = `faq:detail:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      message: "FAQ fetched from cache !!",
      data: cached,
    });
  }

  const faq = await FAQ.findById(id).lean();

  if (!faq) {
    return next(new ErrorHandler("FAQ not found", 404));
  }

  await redis.set(cacheKey, faq, { ex: 3600 });

  res.status(200).json({
    success: true,
    message: "FAQ fetched !!",
    data: faq,
  });
});

export const deleteFAQ = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const faq = await FAQ.findById(id);
  if (!faq) {
    return next(new ErrorHandler("FAQ not found", 404));
  }

  await faq.deleteOne();

  try {
    await redis.del(`faq:detail:${id}`);

    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache deletion failed:", error.message);
  }

  res.status(200).json({
    success: true,
    message: "FAQ deleted successfully",
  });
});

/**
 * @description Get all FAQs for a specific lab
 * @route GET /faq/lab/:labId
 * @access Public
 */
export const getFAQsByLabId = CatchAsyncError(async (req, res, next) => {
  const { labId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Check if we have cached data
  const cacheKey = `faqs:lab:${labId}:page:${page}:limit:${limit}`;
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }
  } catch (error) {
    console.error('Redis cache read failed:', error.message);
  }

  const query = { 
    lab: labId,
    isActive: true 
  };

  const [faqs, total] = await Promise.all([
    FAQ.find(query)
      .populate('lab', 'name')
      .populate('labSection', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    FAQ.countDocuments(query)
  ]);

  const response = {
    success: true,
    message: 'FAQs fetched successfully',
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    count: faqs.length,
    data: faqs
  };

  // Cache the response
  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(response)); // Cache for 1 hour
  } catch (error) {
    console.error('Redis cache write failed:', error.message);
  }

  res.status(200).json(response);
});

export const toggleFAQStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const faq = await FAQ.findById(id);
  if (!faq) {
    return next(new ErrorHandler("FAQ not found", 404));
  }

  faq.isActive = !faq.isActive;
  faq.updatedBy = req.user?._id || null;

  await faq.save();

  try {
    await redis.del(`faq:detail:${id}`);

    const keys = await redis.keys("faqs:list:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache deletion failed:", error.message);
  }

  res.status(200).json({
    success: true,
    message: `FAQ is now ${faq.isActive ? "active" : "inactive"}`,
    data: { _id: faq._id, isActive: faq.isActive },
  });
});

export const getActiveFAQsForSection = CatchAsyncError(
  async (req, res, next) => {
    const { labId, sectionId } = req.params;

    const cacheKey = `faqs:lab:${labId}:section:${sectionId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "FAQs fetched from cache !!",
        data: cached,
      });
    }

    const faqs = await FAQ.find({
      lab: labId,
      labSection: sectionId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    await redis.set(cacheKey, faqs, { ex: 600 });

    res.status(200).json({
      success: true,
      message: "Active FAQs fetched !!",
      data: faqs,
    });
  }
);
