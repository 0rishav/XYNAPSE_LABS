import express from "express";
import {
  toggleLike,
  getLikeStatus,
  incrementView,
  incrementShare,
  getStats,
} from "../controllers/interaction.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";

const interactionRouter = express.Router();

// --- Public Routes (No Login Required) ---

interactionRouter.get("/stats/:courseId", attachRequestId, getStats);

interactionRouter.patch(
  "/increment-view/:courseId",
  attachRequestId,
  incrementView,
);

interactionRouter.patch(
  "/increment-share/:courseId",
  attachRequestId,
  incrementShare,
);

// --- Private Routes (Login Required) ---

interactionRouter.post(
  "/toggle-like/:courseId",
  attachRequestId,
  isAuthenticated,
  toggleLike,
);

interactionRouter.get(
  "/like-status/:courseId",
  attachRequestId,
  isAuthenticated,
  getLikeStatus,
);

export default interactionRouter;
