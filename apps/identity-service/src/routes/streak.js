import express from "express";
import { updateStreak, getMyStreak } from "../controllers/streak.js";
import { isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";

const streakRouter = express.Router();

streakRouter.post("/create", isAuthenticated, updateStreak);
streakRouter.get("/me", isAuthenticated, getMyStreak);

export default streakRouter;
