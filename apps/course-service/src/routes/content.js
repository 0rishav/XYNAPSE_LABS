import express from "express";
import {
  createContent,
  getContentsByChapter,
  getContentById,
  updateContent,
  toggleContentStatus,
  softDeleteContent,
  hardDeleteContent,
} from "../controllers/content.js";
import {
  createContentSchema,
  updateContentSchema,
} from "../../../../packages/common/src/validation/contentSchema.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";

const contentRouter = express.Router();

// --- Public/Authenticated Read Routes ---

contentRouter.get(
  "/chapter/:chapterId",
  attachRequestId,
  isAuthenticated,
  getContentsByChapter,
);

contentRouter.get("/:id", attachRequestId, isAuthenticated, getContentById);

// --- Admin/Instructor Write Routes ---

// Create new lesson/content
contentRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin", "super_admin"),
  sanitizeRequest,
  validateRequest(createContentSchema),
  createContent,
);

contentRouter.patch(
  "/:id/update",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  sanitizeRequest,
  validateRequest(updateContentSchema),
  updateContent,
);

contentRouter.patch(
  "/:id/toggle-status",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  toggleContentStatus,
);

contentRouter.patch(
  "/:id/soft-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  softDeleteContent,
);

contentRouter.delete(
  "/:id/hard-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  hardDeleteContent,
);

export default contentRouter;
