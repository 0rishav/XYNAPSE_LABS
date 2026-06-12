import express from "express";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import {
  attemptMCQQuestion,
  changeMCQStatus,
  createMCQQuestion,
  dislikeMCQQuestion,
  getAllMCQQuestions,
  getMCQQuestion,
  getRandomMCQs,
  likeMCQQuestion,
  reportMCQQuestion,
  updateMCQQuestion,
} from "../controllers/mcqQuestion.js";
import {
  createMCQSchema,
  updateMCQSchema,
} from "../../../../packages/common/src/validation/mcqQuestionSchema.js";

const mcqQuestionRouter = express.Router();

mcqQuestionRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  // validateRequest(createMCQSchema),
  createMCQQuestion,
);

mcqQuestionRouter.put(
  "/update/:id",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  validateRequest(updateMCQSchema),
  updateMCQQuestion,
);

mcqQuestionRouter.get("/all", attachRequestId, getAllMCQQuestions);

mcqQuestionRouter.get("/random", attachRequestId, getRandomMCQs);

mcqQuestionRouter.get("/:id", attachRequestId, getMCQQuestion);

mcqQuestionRouter.post(
  "/:id/attempt",
  attachRequestId,
  isAuthenticated,
  attemptMCQQuestion,
);

mcqQuestionRouter.post("/:id/like", attachRequestId, isAuthenticated, likeMCQQuestion);

mcqQuestionRouter.post(
  "/:id/dislike",
  attachRequestId,
  isAuthenticated,
  dislikeMCQQuestion,
);

mcqQuestionRouter.post(
  "/:id/report",
  attachRequestId,
  isAuthenticated,
  reportMCQQuestion,
);

mcqQuestionRouter.patch(
  "/:id/status",
  attachRequestId,
  isAuthenticated,
  changeMCQStatus,
);


export default mcqQuestionRouter;
