import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import {
  createCourseIntro,
  deleteCourseIntro,
  getCourseIntro,
  hardDeleteCourseIntro,
  reorderCourseIntroBlocks,
  updateCourseIntro,
  updateCourseIntroStatus,
} from "../controllers/courseIntro.js";
import { courseIntroValidationSchema } from "../../../../packages/common/src/validation/courseIntroSchema.js";

const courseIntroRouter = express.Router();

courseIntroRouter.use(attachRequestId);

/* --- PUBLIC --- */
courseIntroRouter.get("/:courseId", sanitizeRequest, getCourseIntro);

courseIntroRouter.use(isAuthenticated);
courseIntroRouter.use(hasRole("lab_admin"));

courseIntroRouter.post(
  "/create",
  sanitizeRequest,
  validateRequest(courseIntroValidationSchema.create),
  createCourseIntro,
);

courseIntroRouter.patch(
  "/update/:courseId",
  sanitizeRequest,
  validateRequest(courseIntroValidationSchema.update),
  updateCourseIntro,
);

courseIntroRouter.patch(
  "/:courseId/status",
  validateRequest(courseIntroValidationSchema.updateStatus),
  updateCourseIntroStatus,
);

courseIntroRouter.put(
  "/:courseId/reorder",
  validateRequest(courseIntroValidationSchema.reorder),
  reorderCourseIntroBlocks,
);

courseIntroRouter.patch("/:courseId/soft-delete", deleteCourseIntro);

courseIntroRouter.delete(
  "/:courseId/hard-delete",
  hasRole("lab_admin"),
  hardDeleteCourseIntro,
);

export default courseIntroRouter;
