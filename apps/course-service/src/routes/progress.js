import express from "express";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  getAdminCourseStats,
  getAdminUserProgress,
  getContentStatus,
  getCourseProgress,
  resumeCourse,
  updateChapterProgress,
  updateContentProgress,
} from "../controllers/progress.js";
import {
  getContentStatusSchema,
  getCourseProgressSchema,
  updateProgressSchema,
} from "../../../../packages/common/src/validation/progressSchema.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";

const progressRouter = express.Router();

progressRouter.use(isAuthenticated);

progressRouter.patch(
  "/content/:contentId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(updateProgressSchema),
  updateContentProgress,
);

progressRouter.patch(
  "/chapter/:chapterId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(updateProgressSchema),
  updateChapterProgress,
);

progressRouter.get(
  "/course/:courseId",
  attachRequestId,
  validateRequest(getCourseProgressSchema),
  getCourseProgress,
);

progressRouter.get(
  "/content/:contentId/status",
  attachRequestId,
  validateRequest(getContentStatusSchema),
  getContentStatus,
);

progressRouter.get(
  "/resume/:courseId",
  attachRequestId,
  validateRequest(getCourseProgressSchema),
  resumeCourse,
);

// --- Admin Routes (Analytics) ---

progressRouter.get(
  "/admin/user/:userId",
  attachRequestId,
  hasRole("lab_admin"),
  getAdminUserProgress,
);

progressRouter.get(
  "/admin/stats/:courseId",
  attachRequestId,
  hasRole("lab_admin"),
  validateRequest(getCourseProgressSchema),
  getAdminCourseStats,
);

export default progressRouter;
