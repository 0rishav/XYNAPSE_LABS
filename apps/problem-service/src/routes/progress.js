import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { markChapterRead, getLabProgress } from "../controllers/progress.js";

const progressRouter = express.Router();

// Mark a chapter as read
progressRouter.post("/chapter/read", isAuthenticated, markChapterRead);

// Get a user's progress summary for a lab
progressRouter.get("/lab/:labId", isAuthenticated, getLabProgress);

export default progressRouter;
