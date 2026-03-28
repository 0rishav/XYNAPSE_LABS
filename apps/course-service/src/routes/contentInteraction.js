import express from "express";
import {
  toggleContentLike,
  shareContent,
  getContentStats,
  trackContentView,
  getMyLikedContent,
} from "../controllers/contentInteraction.js";

import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";

const contentInteractionRouter = express.Router();

// --- Public Routes ---
contentInteractionRouter.get(
  "/stats/:contentId",
  attachRequestId,
  getContentStats,
);

contentInteractionRouter.patch(
  "/increment-view/:contentId",
  attachRequestId,
  trackContentView,
);

// --- Private Routes ---
contentInteractionRouter.post(
  "/toggle-like/:contentId",
  attachRequestId,
  isAuthenticated,
  toggleContentLike,
);

contentInteractionRouter.post(
  "/share/:contentId",
  attachRequestId,
  isAuthenticated,
  shareContent,
);

contentInteractionRouter.get(
  "/me/liked",
  attachRequestId,
  isAuthenticated,
  getMyLikedContent,
);

export default contentInteractionRouter;
