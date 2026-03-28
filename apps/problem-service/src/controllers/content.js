import mongoose from "mongoose";
import Content from "../models/contentModal.js";

import Chapter from "../models/chapterModal.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { redis } from "../../../../packages/common/src/infra/redisClient.js";
import { deleteFromCloudinary, deleteMultipleLocalFiles, uploadOnCloudinary } from "../../../../packages/common/src/infra/uploadOnCloudinary.js";
import { sanitizeObject, sanitizeString } from "../../../../packages/common/src/utils/sanitizeInput.js";
import { applyUpdatesToContent } from "../../../../packages/common/src/utils/updateContentFields.js";

export const contentSanitizeSchema = {
  title: "string",
  description: "string",
  slug: "string",
  body: "string",
  code: "string",
  category: "string",
  status: "string",
  visibility: "string",
  chapterId: "string",
  labId: "string",
  labsectionId: "string",
  tags: "array",
  keywords: "array",
};

// export const createContent = CatchAsyncError(async (req, res, next) => {
//   const thumbnailFile = req.files?.thumbnail?.[0];
//   const attachmentFiles = req.files?.attachments || [];

//   const cleanupFiles = [
//     ...(req.files?.thumbnail || []),
//     ...(req.files?.attachments || []),
//   ];

//   try {
//     const sanitizedData = {
//       ...sanitizeObject(req.body, contentSanitizeSchema),
//       body: sanitizeString(req.body.body, { stripHtml: false, escape: false }),
//       code: sanitizeString(req.body.code, { stripHtml: false, escape: false }),
//     };

//     const {
//       title,
//       description,
//       slug,
//       body,
//       code,
//       category,
//       status,
//       visibility,
//       chapterId,
//       labId,
//       labsectionId,
//       tags = [],
//       keywords = [],
//     } = sanitizedData;

//     if (!title || !slug || !body) {
//       throw new ErrorHandler("Title, slug, and body are required", 400);
//     }

//     const existingContent = await Content.findOne({ slug });
//     if (existingContent) {
//       throw new ErrorHandler("Slug already exists", 409);
//     }

//     let uploadedThumbnail = null;
//     if (thumbnailFile?.path) {
//       const uploaded = await uploadOnCloudinary(thumbnailFile.path);
//       uploadedThumbnail = {
//         public_id: uploaded.public_id,
//         secure_url: uploaded.secure_url,
//       };
//     }

//     const uploadedAttachments = [];
//     for (const file of attachmentFiles) {
//       if (file?.path) {
//         const uploaded = await uploadOnCloudinary(file.path);
//         uploadedAttachments.push({
//           public_id: uploaded.public_id,
//           secure_url: uploaded.secure_url,
//         });
//       }
//     }

//     const contentDoc = new Content({
//       title,
//       description,
//       slug,
//       body,
//       code,
//       category,
//       status,
//       visibility,
//       chapterId,
//       labId,
//       labsectionId,
//       tags,
//       keywords,
//       author: req.user._id,
//       thumbnail: uploadedThumbnail,
//       attachments: uploadedAttachments,
//     });

//     const savedContent = await contentDoc.save();

//     const keys = await redis.keys(
//       `contents:${labId || "all"}:${labsectionId || "all"}:${
//         chapterId || "all"
//       }:*`
//     );
//     if (keys.length) await redis.del(keys);

//     await redis.set(`content:${slug}`, savedContent, {
//       EX: 60 * 60,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Content created successfully",
//       data: savedContent,
//     });
//   } catch (err) {
//     return next(
//       err instanceof ErrorHandler
//         ? err
//         : new ErrorHandler("Internal Server Error", 500)
//     );
//   } finally {
//     deleteMultipleLocalFiles(cleanupFiles);
//   }
// });

// export const createContent = CatchAsyncError(async (req, res, next) => {
//   const thumbnailFile = req.files?.thumbnail?.[0];
//   console.log(thumbnailFile, "Thumbnail File");
//   const attachmentFiles = req.files?.attachments || [];

//   const cleanupFiles = [
//     ...(req.files?.thumbnail || []),
//     ...(req.files?.attachments || []),
//   ];

//   try {
//     // Sanitize input data
//     const sanitizedData = {
//       ...sanitizeObject(req.body, contentSanitizeSchema),
//       body: sanitizeString(req.body.body, { stripHtml: false, escape: false }),
//       code: sanitizeString(req.body.code, { stripHtml: false, escape: false }),
//     };

//     const {
//       title,
//       description,
//       slug,
//       body,
//       code,
//       category,
//       status,
//       visibility,
//       chapterId,
//       labId,
//       labsectionId,
//       tags = [],
//       keywords = [],
//     } = sanitizedData;

//     if (!title || !slug || !body) {
//       throw new ErrorHandler("Title, slug, and body are required", 400);
//     }

//     const existingContent = await Content.findOne({ slug });
//     if (existingContent) {
//       throw new ErrorHandler("Slug already exists", 409);
//     }

//     // Thumbnail upload (required)
//     if (!thumbnailFile?.path) {
//       return res.status(400).json({
//         success: false,
//         message: "Thumbnail image is required.",
//       });
//     }

//     let uploadedThumbnail;
//     try {
//       const uploaded = await uploadOnCloudinary(thumbnailFile.path);
//       uploadedThumbnail = {
//         public_id: uploaded.public_id,
//         secure_url: uploaded.secure_url,
//       };
//     } catch (error) {
//       console.error("Cloudinary thumbnail upload failed:", error);
//       return res.status(500).json({
//         error: "Failed to upload thumbnail. Please try again.",
//         details: error.message || error,
//       });
//     }

//     // Attachments upload
//     let uploadedAttachments = [];
//     try {
//       for (const file of attachmentFiles) {
//         if (file?.path) {
//           const uploaded = await uploadOnCloudinary(file.path);
//           uploadedAttachments.push({
//             public_id: uploaded.public_id,
//             secure_url: uploaded.secure_url,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Cloudinary attachments upload failed:", error);
//       return res.status(500).json({
//         error: "Failed to upload one or more attachments. Please try again.",
//         details: error.message || error,
//       });
//     }

//     // Create content document
//     const contentDoc = new Content({
//       title,
//       description,
//       slug,
//       body,
//       code,
//       category,
//       status,
//       visibility,
//       chapterId,
//       labId,
//       labsectionId,
//       tags,
//       keywords,
//       author: req.user._id,
//       thumbnail: uploadedThumbnail,
//       attachments: uploadedAttachments,
//     });

//     const savedContent = await contentDoc.save();

//     // await redis.set(`content:${slug}`, JSON.stringify(savedContent), {
//     //   EX: 60 * 60,
//     // });

//     return res.status(201).json({
//       success: true,
//       message: "Content created successfully",
//       data: savedContent,
//     });
//   } catch (err) {
//     return next(
//       err instanceof ErrorHandler ? err : new ErrorHandler(err.message, 500)
//     );
//   } finally {
//     deleteMultipleLocalFiles(cleanupFiles);
//   }
// });

export const createContent = CatchAsyncError(async (req, res, next) => {
  const thumbnailFile = req.files?.thumbnail?.[0];
  const attachmentFiles = req.files?.attachments || [];

  const cleanupFiles = [
    ...(req.files?.thumbnail || []),
    ...(req.files?.attachments || []),
  ];

  try {
    const sanitizedData = {
      ...sanitizeObject(req.body, contentSanitizeSchema),
      body: sanitizeString(req.body.body, { stripHtml: false, escape: false }),
      code: sanitizeString(req.body.code, { stripHtml: false, escape: false }),
    };

    const {
      title,
      slug,
      body,
      description,
      code,
      category,
      status,
      visibility,
      chapterId,
      labId,
      labsectionId,
      tags = [],
      keywords = [],
    } = sanitizedData;

    if (!title || !slug || !body) {
      throw new ErrorHandler("Title, slug, and body are required", 400);
    }

    const existingContent = await Content.findOne({ slug });
    if (existingContent) {
      throw new ErrorHandler("Slug already exists", 409);
    }

    if (!thumbnailFile?.path) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required.",
      });
    }

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path)
      .then(uploaded => ({
        public_id: uploaded.public_id,
        secure_url: uploaded.secure_url,
      }));

    const uploadedAttachments = [];
    for (const file of attachmentFiles) {
      if (file?.path) {
        const uploaded = await uploadOnCloudinary(file.path);
        uploadedAttachments.push({
          public_id: uploaded.public_id,
          secure_url: uploaded.secure_url,
        });
      }
    }

    const contentDoc = new Content({
      title,
      description,
      slug,
      body,
      code,
      category,
      status,
      visibility,
      chapterId,
      labId,
      labsectionId,
      tags,
      keywords,
      author: req.user._id,
      thumbnail: uploadedThumbnail,
      attachments: uploadedAttachments,
    });

    const savedContent = await contentDoc.save();

    return res.status(201).json({
      success: true,
      message: "Content created successfully",
      data: savedContent,
    });
  } catch (err) {
    return next(
      err instanceof ErrorHandler ? err : new ErrorHandler(err.message, 500)
    );
  } finally {
    deleteMultipleLocalFiles(cleanupFiles);
  }
});

export const updateContent = CatchAsyncError(async (req, res, next) => {
  const { contentId } = req.params;

  const existingContent = await Content.findById(contentId);
  if (!existingContent) {
    return next(new ErrorHandler("Content not found", 404));
  }

  const cleanupFiles = [
    ...(req.files?.thumbnail || []),
    ...(req.files?.attachments || []),
  ];

  try {
    const sanitizedData = {
      ...sanitizeObject(req.body, contentSanitizeSchema),
      body: sanitizeString(req.body.body, { stripHtml: false, escape: false }),
      code: sanitizeString(req.body.code, { stripHtml: false, escape: false }),
    };

    applyUpdatesToContent(existingContent, sanitizedData);

    const thumbnailFile = req.files?.thumbnail?.[0];
    if (thumbnailFile?.path) {
      const uploaded = await uploadOnCloudinary(thumbnailFile.path);
      existingContent.thumbnail = {
        public_id: uploaded.public_id,
        secure_url: uploaded.secure_url,
      };
    }

    const attachmentFiles = req.files?.attachments || [];
    if (attachmentFiles.length) {
      const uploadedAttachments = [];
      for (const file of attachmentFiles) {
        if (file?.path) {
          const uploaded = await uploadOnCloudinary(file.path);
          uploadedAttachments.push({
            public_id: uploaded.public_id,
            secure_url: uploaded.secure_url,
          });
        }
      }
      existingContent.attachments = [
        ...existingContent.attachments,
        ...uploadedAttachments,
      ];
    }

    await existingContent.save();

    const { labId, labsectionId, chapterId } = existingContent;
    const keys = await redis.keys(
      `contents:${labId || "all"}:${labsectionId || "all"}:${chapterId || "all"}:*`
    );
    if (keys.length) {
      await redis.del(keys);
    }

    res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: existingContent,
    });
  } catch (err) {
    return next(
      err instanceof ErrorHandler ? err : new ErrorHandler(err.message, 500)
    );
  } finally {
    deleteMultipleLocalFiles(cleanupFiles);
  }
});

export const getAllContents = CatchAsyncError(async (req, res, next) => {
  const { labId, labsectionId, chapterId, page = 1, limit = 2 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (labId) query.labId = labId;
  if (labsectionId) query.labsectionId = labsectionId;
  if (chapterId) query.chapterId = chapterId;

  const contents = await Content.find(query)
    .populate("labId", "name")
    .populate("labsectionId", "title")
    .populate("chapterId", "title")
    .populate("author", "name email")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Content.countDocuments(query);

  const response = {
    contents,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };

  res.status(200).json({
    success: true,
    source: "database",
    ...response,
  });
});

// export const getAllContents = CatchAsyncError(async (req, res, next) => {
//   let { labId, labsectionId, chapterId, page = 1, limit = 2 } = req.query;

//   page = parseInt(page);
//   limit = parseInt(limit);

//   if (!chapterId) {
//     return next(new ErrorHandler("chapterId is required", 400));
//   }

//   // Optional: Validate labId and labsectionId if needed
//   const chapter = await Chapter.findById(chapterId).lean();
//   if (!chapter) {
//     return next(new ErrorHandler("Chapter not found", 404));
//   }

//   const isPaidChapter = chapter.accessLevel && chapter.accessLevel !== "free";

//   const ACCESS_HIERARCHY = {
//     free: ["free"],
//     standard: ["free", "standard"],
//     premium: ["free", "standard", "premium"],
//   };
//   const userAccessLevel = req.accessLevel || "free";
//   const allowedAccessLevels = ACCESS_HIERARCHY[userAccessLevel];

//   let responseData = {};

//   if (!isPaidChapter || allowedAccessLevels.includes(chapter.accessLevel)) {
//     // Build query filter
//     const queryFilter = { chapterId };
//     if (labId) queryFilter.labId = labId;
//     if (labsectionId) queryFilter.labsectionId = labsectionId;

//     const contents = await Content.find(queryFilter)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     const totalCount = await Content.countDocuments(queryFilter);

//     responseData = {
//       success: true,
//       source: "database",
//       page,
//       limit,
//       totalContents: totalCount,
//       totalPages: Math.ceil(totalCount / limit),
//       contents,
//     };
//   } else {
//     responseData = {
//       success: true,
//       source: "database",
//       contents: {
//         title: "Access Restricted !!",
//         isLocked: true,
//       },
//     };
//   }

//   res.status(200).json(responseData);
// });

export const getContentById = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Content ID", 400));
  }

  const cachedContent = await redis.get(`content:${id}`);
  if (false) {
    return res.status(200).json({
      success: true,
      source: "cache",
      content: cachedContent,
    });
  }

  const content = await Content.findById(id);
  if (!content || content.isDeleted) {
    return next(new ErrorHandler("Content not found", 404));
  }

  await redis.set(`content:${id}`, content, {
    EX: 60 * 5,
  });

  res.status(200).json({
    success: true,
    source: "database",
    content,
  });
});

export const deleteContent = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Content ID", 400));
  }

  const content = await Content.findById(id);
  if (!content || content.isDeleted) {
    return next(new ErrorHandler("Content not found or already deleted", 404));
  }

  if (content.thumbnail?.public_id) {
    await deleteFromCloudinary(content.thumbnail.public_id);
  }

  for (const attachment of content.attachments || []) {
    if (attachment.public_id) {
      await deleteFromCloudinary(attachment.public_id);
    }
  }

  content.isDeleted = true;
  await content.save();

  const { labId, labsectionId, chapterId, slug } = content;

  const keys = await redis.keys(
    `contents:${labId || "all"}:${labsectionId || "all"}:${
      chapterId || "all"
    }:*`
  );
  if (keys.length) await redis.del(keys);

  await redis.del(`content:${slug}`);

  res.status(200).json({
    success: true,
    message: "Content soft deleted successfully",
  });
});

export const incrementView = CatchAsyncError(async (req, res, next) => {
  const contentId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return next(new ErrorHandler("Invalid content ID", 400));
  }

  const content = await Content.findByIdAndUpdate(
    contentId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!content) {
    return next(new ErrorHandler("Content not found", 404));
  }

  const { labId, labsectionId, chapterId, slug } = content;

  const keys = await redis.keys(
    `contents:${labId || "all"}:${labsectionId || "all"}:${
      chapterId || "all"
    }:*`
  );
  if (keys.length) await redis.del(keys);

  await redis.set(`content:${slug}`, content, { EX: 60 * 60 });

  res.status(200).json({
    success: true,
    message: "View count incremented",
    views: content.views,
  });
});

export const toggleLike = CatchAsyncError(async (req, res, next) => {
  const contentId = req.params.id;
  const action = req.query.action;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return next(new ErrorHandler("Invalid content ID", 400));
  }

  const content = await Content.findById(contentId);
  if (!content) {
    return next(new ErrorHandler("Content not found", 404));
  }

  if (action === "like") {
    content.likes += 1;
  } else if (action === "unlike" && content.likes > 0) {
    content.likes -= 1;
  } else {
    return next(new ErrorHandler("Invalid action", 400));
  }

  await content.save({ validateBeforeSave: false });

  const { labId, labsectionId, chapterId, slug } = content;

  const keys = await redis.keys(
    `contents:${labId || "all"}:${labsectionId || "all"}:${
      chapterId || "all"
    }:*`
  );
  if (keys.length) await redis.del(keys);

  await redis.set(`content:${slug}`, content, { EX: 60 * 60 });

  res.status(200).json({
    success: true,
    message: action === "like" ? "Liked" : "Unliked",
    likes: content.likes,
  });
});

export const toggleBookmark = CatchAsyncError(async (req, res, next) => {
  const contentId = req.params.id;
  const action = req.query.action;

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return next(new ErrorHandler("Invalid content ID", 400));
  }

  const content = await Content.findById(contentId);
  if (!content) {
    return next(new ErrorHandler("Content not found", 404));
  }

  if (action === "bookmark") {
    content.bookmarks += 1;
  } else if (action === "unbookmark" && content.bookmarks > 0) {
    content.bookmarks -= 1;
  } else {
    return next(new ErrorHandler("Invalid action", 400));
  }

  await content.save();
  const { labId, labsectionId, chapterId, slug } = content;

  const keys = await redis.keys(
    `contents:${labId || "all"}:${labsectionId || "all"}:${
      chapterId || "all"
    }:*`
  );
  if (keys.length) await redis.del(keys);

  await redis.set(`content:${slug}`, content, { EX: 60 * 60 });

  res.status(200).json({
    success: true,
    message: action === "bookmark" ? "Bookmarked" : "Unbookmarked",
    bookmarks: content.bookmarks,
  });
});

export const searchContent = CatchAsyncError(async (req, res, next) => {
  const rawQuery = req.query.q || "";
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  const query = sanitizeString(rawQuery);
  const page = Number.isNaN(parseInt(rawPage)) ? 1 : parseInt(rawPage);
  const limit = Number.isNaN(parseInt(rawLimit)) ? 10 : parseInt(rawLimit);
  const skip = (page - 1) * limit;

  if (!query) {
    return next(new ErrorHandler("Search query is required", 400));
  }

  const searchRegex = new RegExp(query, "i");

  const results = await Content.find({
    $or: [
      { title: searchRegex },
      { body: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
  })
    .skip(skip)
    .limit(limit);

  const total = await Content.countDocuments({
    $or: [
      { title: searchRegex },
      { body: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
  });

  const pagination = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: results,
    pagination,
  });
});

export const updateContentVersion = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!["increment", "rollback"].includes(action)) {
    return next(
      new ErrorHandler("Invalid action. Use 'increment' or 'rollback'.", 400)
    );
  }

  const cacheKey = `content:${id}`;
  let content;

  const cachedContent = await redis.get(cacheKey);
  if (cachedContent) {
    content = cachedContent;
  } else {
    content = await Content.findById(id);
    if (!content) return next(new ErrorHandler("Content not found", 404));
    await redis.set(cacheKey, content, { ex: 60 * 5 });
  }

  if (action === "increment") {
    content.version += 1;
  } else {
    if (content.version > 1) content.version -= 1;
    else return next(new ErrorHandler("Version cannot be less than 1", 400));
  }

  await Content.findByIdAndUpdate(id, { version: content.version });

  await redis.del(cacheKey);

  res.status(200).json({
    success: true,
    message: `Version ${action}ed successfully`,
    version: content.version,
  });
});

export const getRelatedContent = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `related:${id}`;

  // 🔴 Redis cache check ko comment kar diya
  // const cached = await redis.get(cacheKey);
  // if (cached) {
  //   return res.status(200).json({
  //     success: true,
  //     source: "cache",
  //     cached,
  //   });
  // }

  const content = await Content.findById(id);
  if (!content) return next(new ErrorHandler("Content not found", 404));

  const related = await Content.find({
    _id: { $ne: content._id },
    tags: { $in: content.tags },
  }).limit(10);

  const result = {
    count: related.length,
    data: related,
  };

  // 🔴 Redis set ko bhi comment kar diya
  // await redis.set(cacheKey, result, { ex: 60 * 10 });

  res.status(200).json({
    success: true,
    source: "db",
    ...result,
  });
});
