import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  createReply,
  deleteReply,
  getAdminReplies,
  getReviewReplies,
  hardDeleteReply,
  likeReply,
  updateReply,
} from "../controllers/reviewReply.js";
import { hasRole, isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";
import {
  createReplySchema,
  getRepliesQuerySchema,
  updateReplySchema,
} from "../../../../packages/common/src/validation/reviewReplySchema.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";

const reviewReplyRouter = express.Router();

reviewReplyRouter.use(attachRequestId);
reviewReplyRouter.use(sanitizeRequest);

reviewReplyRouter.get("/:reviewId/replies", getReviewReplies);

reviewReplyRouter.post(
  "/:reviewId/replies",
  isAuthenticated,
  validateRequest(createReplySchema),
  createReply,
);

reviewReplyRouter.patch(
  "/replies/:replyId",
  isAuthenticated,
  validateRequest(updateReplySchema),
  updateReply,
);

reviewReplyRouter.delete("/replies/:replyId", isAuthenticated, deleteReply);

reviewReplyRouter.patch("/replies/:replyId/like", isAuthenticated, likeReply);

reviewReplyRouter.get(
  "/admin/all",
  isAuthenticated,
  hasRole("lab_admin", "moderator"),
  validateRequest(getRepliesQuerySchema),
  getAdminReplies,
);

reviewReplyRouter.delete(
  "/admin/:replyId",
  isAuthenticated,
  hasRole("lab_admin"),
  hardDeleteReply,
);

export default reviewReplyRouter;
