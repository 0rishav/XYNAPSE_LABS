import express from "express";

import { isAuthenticated } from "../middleware/auth.js";
import {
  createMCQSubmission,
  deleteMCQSubmission,
  evaluateMCQSubmission,
  finalizeMCQSubmission,
  getAllMCQSubmissions,
  getLabMCQStats,
  getMCQSubmissionById,
  getMyMCQSubmissions,
  getQuestionMCQStats,
  getUserMCQStats,
  hardDeleteMCQSubmission,
  reviewMCQSubmission,
  updateMCQSubmissionStatus,
} from "../controllers/mcqSubmission.js";

const mcqSubmissionRouter = express.Router();

mcqSubmissionRouter.post("/create", isAuthenticated, createMCQSubmission);
mcqSubmissionRouter.get("/my", isAuthenticated, getMyMCQSubmissions);
mcqSubmissionRouter.get("/my/:id", isAuthenticated, getMCQSubmissionById);
mcqSubmissionRouter.delete("/my/:id", isAuthenticated, deleteMCQSubmission);
mcqSubmissionRouter.put(
  "/evaluate/:id",
  isAuthenticated,
  evaluateMCQSubmission
);
mcqSubmissionRouter.put(
  "/finalize/:id",
  isAuthenticated,
  finalizeMCQSubmission
);
mcqSubmissionRouter.get("/review/:id", isAuthenticated, reviewMCQSubmission);

//  Stats
mcqSubmissionRouter.get("/stats/user", isAuthenticated, getUserMCQStats);
mcqSubmissionRouter.get("/stats/lab/:labId", isAuthenticated, getLabMCQStats);
mcqSubmissionRouter.get(
  "/stats/question/:questionId",
  isAuthenticated,
  getQuestionMCQStats
);

mcqSubmissionRouter.get("/all", isAuthenticated, getAllMCQSubmissions);
mcqSubmissionRouter.delete(
  "/hard-delete/:id",
  isAuthenticated,
  hardDeleteMCQSubmission
);
mcqSubmissionRouter.put(
  "/status/:id",
  isAuthenticated,
  updateMCQSubmissionStatus
);
// ye naya add hua h

export default mcqSubmissionRouter;
