import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createReview,
  deleteAdminReview,
  deleteReview,
  getAllReviews,
  getReviewByLab,
  toggleHelpful,
  toggleNotHelpful,
  toggleVisibility,
  updateReview,
} from "../controllers/review.js";

const reviewRouter = express.Router();

reviewRouter.post("/create", isAuthenticated, createReview);
reviewRouter.get("/:labId/get", isAuthenticated, getReviewByLab);
reviewRouter.put("/:reviewId/update", isAuthenticated, updateReview);
reviewRouter.delete("/:reviewId", isAuthenticated, deleteReview);
reviewRouter.patch("/:reviewId/helpful", isAuthenticated, toggleHelpful);
reviewRouter.patch("/:reviewId/not-helpful", isAuthenticated, toggleNotHelpful);

// for lab admin purpose

reviewRouter.get(
  "/reviews",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllReviews,
);
reviewRouter.patch(
  "/:reviewId/toggle-visibility",
  isAuthenticated,
  hasRole("lab_admin"),
  toggleVisibility,
);
reviewRouter.delete(
  "/admin-delete/:reviewId",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteAdminReview,
);
export default reviewRouter;
