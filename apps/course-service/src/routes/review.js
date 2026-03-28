import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import {
  createReviewSchema,
  getReviewsQuerySchema,
  toggleReviewStatusSchema,
  updateReviewSchema,
} from "../../../../packages/common/src/validation/reviewSchema.js";
import {
  createReview,
  deleteReview,
  deleteReviewByAdmin,
  getAdminReviews,
  getCourseReviews,
  likeReview,
  updateReview,
  updateReviewStatus,
} from "../controllers/review.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";

const reviewRouter = express.Router();

reviewRouter.use(attachRequestId);
reviewRouter.use(sanitizeRequest);

// PUBLIC ROUTE

reviewRouter.get(
  "/:courseId",
  validateRequest(getReviewsQuerySchema),
  getCourseReviews,
);

reviewRouter.post(
  "/:courseId",
  isAuthenticated,
  validateRequest(createReviewSchema),
  createReview,
);

reviewRouter.patch(
  "/:reviewId",
  isAuthenticated,
  validateRequest(updateReviewSchema),
  updateReview,
);

reviewRouter.delete("/:reviewId", isAuthenticated, deleteReview);

reviewRouter.patch("/:reviewId/like", isAuthenticated, likeReview);

// ADMIN ROUTES

reviewRouter.get(
  "/admin/all",
  isAuthenticated,
  hasRole("lab_admin", "moderator"),
  getAdminReviews,
);

reviewRouter.patch(
  "/admin/:reviewId/status",
  isAuthenticated,
  hasRole("lab_admin"),
  validateRequest(toggleReviewStatusSchema),
  updateReviewStatus,
);

reviewRouter.delete(
  "/admin/:reviewId",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteReviewByAdmin,
);

export default reviewRouter;
