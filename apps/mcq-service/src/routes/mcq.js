import express from "express";

import {
  attemptMCQQuestion,
  changeMCQAccessLevel,
  changeMCQStatus,
  createMCQQuestion,
  deleteMCQQuestion,
  dislikeMCQQuestion,
  getAllMCQQuestions,
  getMCQAnalytics,
  getMCQQuestion,
  getRandomMCQs,
  likeMCQQuestion,
  reportMCQQuestion,
  updateMCQQuestion,
} from "../controllers/mcqQuestion.js";

import { isAuthenticated } from "../middleware/auth.js";

const mcqRouter = express.Router();

mcqRouter.post("/create", createMCQQuestion);
mcqRouter.put("/update/:id", updateMCQQuestion);
mcqRouter.delete("/delete/:id", deleteMCQQuestion);

// Status and access level changes
mcqRouter.patch("/status/:id", changeMCQStatus);
mcqRouter.patch("/access/:id", changeMCQAccessLevel);

// Fetching questions
mcqRouter.get("/get/:id", getMCQQuestion);
mcqRouter.get("/get-all", getAllMCQQuestions);
mcqRouter.get("/random", getRandomMCQs);

// MCQ interaction
mcqRouter.post("/attempt/:id", attemptMCQQuestion);
mcqRouter.post("/like/:id", isAuthenticated, likeMCQQuestion);
mcqRouter.post("/dislike/:id", isAuthenticated, dislikeMCQQuestion);
mcqRouter.post("/report/:id", reportMCQQuestion);

// Analytics
mcqRouter.get("/analytics/:id", getMCQAnalytics);

export default mcqRouter;
