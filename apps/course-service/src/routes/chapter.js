import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";

import {
  createChapter,
  updateChapter,
  getChaptersByCourse,
  getChapterById,
  reorderChapters,
  softDeleteChapter,
  hardDeleteChapter,
} from "../controllers/chapter.js";

import {
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
} from "../../../../packages/common/src/validation/chapterSchema.js";

const chapterRouter = express.Router();

chapterRouter.get(
  "/course/:courseId",
  attachRequestId,
  isAuthenticated,
  getChaptersByCourse,
);

chapterRouter.get(
  "/course/:courseId",
  attachRequestId,
  isAuthenticated,
  getChaptersByCourse,
);

chapterRouter.get("/:id", attachRequestId, isAuthenticated, getChapterById);

chapterRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  sanitizeRequest,
  validateRequest(createChapterSchema),
  createChapter,
);

chapterRouter.patch(
  "/reorder",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  sanitizeRequest,
  validateRequest(reorderChaptersSchema),
  reorderChapters,
);

chapterRouter.patch(
  "/:id/update",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  sanitizeRequest,
  validateRequest(updateChapterSchema),
  updateChapter,
);

chapterRouter.patch(
  "/:id/soft-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  softDeleteChapter,
);

chapterRouter.delete(
  "/:id/hard-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  hardDeleteChapter,
);

export default chapterRouter;
