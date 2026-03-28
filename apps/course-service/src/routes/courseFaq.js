import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  createFAQ,
  deleteFAQ,
  getCourseFAQs,
  hardDeleteFAQ,
  reorderFAQs,
  updateFAQ,
  updateFAQStatus,
} from "../controllers/courseFaq.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import { courseFAQValidationSchema } from "../../../../packages/common/src/validation/FaqSchema.js";

const faqRouter = express.Router();

faqRouter.use(attachRequestId);

faqRouter.get("/:courseId", sanitizeRequest, getCourseFAQs);

faqRouter.use(isAuthenticated);
faqRouter.use(hasRole("lab_admin"));

faqRouter.post(
  "/create",
  sanitizeRequest,
  validateRequest(courseFAQValidationSchema.create),
  createFAQ,
);

faqRouter.patch(
  "/:faqId/update",
  sanitizeRequest,
  validateRequest(courseFAQValidationSchema.update),
  updateFAQ,
);

faqRouter.patch(
  "/:faqId/status",
  validateRequest(courseFAQValidationSchema.updateStatus),
  updateFAQStatus,
);

faqRouter.put(
  "/reorder",
  validateRequest(courseFAQValidationSchema.reorder),
  reorderFAQs,
);

faqRouter.patch("/:faqId/soft-delete", deleteFAQ);

faqRouter.delete("/:faqId/hard-delete", hasRole("lab_admin"), hardDeleteFAQ);

export default faqRouter;
