import express from "express";
import {
  createCoursePricing,
  updateCoursePricing,
  patchSinglePlan,
  getAdminCoursePricing,
  deleteCoursePricing,
  getPublicCoursePricing,
} from "../controllers/coursePricing.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  createPricingSchema,
  deletePricingSchema,
  getAdminPricingSchema,
  getUserPricingSchema,
  updatePricingSchema,
} from "../../../../packages/common/src/validation/coursePriceSchema.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";

const pricingRouter = express.Router();

// Public Routes - Students can view pricing

pricingRouter.get(
  "/:courseId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(getUserPricingSchema),
  getPublicCoursePricing,
);

// ADMIN Routes

pricingRouter.use(isAuthenticated, hasRole("admin"));

// 1. Create Pricing
pricingRouter.post(
  "/admin/:courseId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(createPricingSchema),
  createCoursePricing,
);

pricingRouter.get(
  "/admin/:courseId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(getAdminPricingSchema),
  getAdminCoursePricing,
);

pricingRouter.put(
  "/admin/:courseId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(updatePricingSchema),
  updateCoursePricing,
);

pricingRouter.patch(
  "/admin/:courseId/plans/:planCode",
  attachRequestId,
  sanitizeRequest,
  patchSinglePlan,
);

pricingRouter.delete(
  "/admin/:courseId",
  attachRequestId,
  sanitizeRequest,
  validateRequest(deletePricingSchema),
  deleteCoursePricing,
);

export default pricingRouter;
