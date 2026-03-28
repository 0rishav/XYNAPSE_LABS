import express from "express";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  getRecommendations,
  hardDeleteCourse,
  moveCourseCategory,
  searchCourses,
  softDeleteCourse,
  toggleCourseStatus,
  updateCourse,
} from "../controllers/courses.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../../../../packages/common/src/validation/courseSchema.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";

const courseRouter = express.Router();

courseRouter.get("/search", attachRequestId, isAuthenticated, searchCourses);
courseRouter.get(
  "/:id/recommendations",
  attachRequestId,
  isAuthenticated,
  getRecommendations,
);
courseRouter.get("/all", attachRequestId,isAuthenticated, hasRole("lab_admin"),  getAllCourses);

courseRouter.get("/public/all", attachRequestId,  getAllCourses);

courseRouter.get("/s/:slug", attachRequestId, isAuthenticated, getCourseBySlug);

courseRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("thumbnail"),
  sanitizeRequest,
  validateRequest(createCourseSchema),
  createCourse,
);

courseRouter.patch(
  "/:id/update",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("thumbnail"),
  sanitizeRequest,
  validateRequest(updateCourseSchema),
  updateCourse,
);

courseRouter.patch(
  "/:id/publish",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  toggleCourseStatus,
);

courseRouter.patch(
  "/:id/move-category",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  moveCourseCategory,
);

courseRouter.patch(
  "/:id/soft-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  softDeleteCourse,
);

courseRouter.delete(
  "/:id/hard-delete",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  hardDeleteCourse,
);

export default courseRouter;
