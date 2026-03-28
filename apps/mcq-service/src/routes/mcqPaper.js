import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";
import {
  createMCQPaper,
  updateMCQPaper,
  deleteMCQPaper,
  getMCQPaper,
  listMCQPapers,
  getPaperQuestions,
  addQuestionToPaper,
  removeQuestionFromPaper,
  listMCQPapersWithQuestions,
} from "../controllers/mcqPaper.js";
import { upload } from "../utils/multerConfig.js";

const mcqPaperRouter = express.Router();

mcqPaperRouter.post(
  "/create",
  isAuthenticated,
  upload.single("thumbnail"),
  createMCQPaper
);
mcqPaperRouter.put(
  "/update/:id",
  isAuthenticated,
  upload.single("thumbnail"),
  updateMCQPaper
);
mcqPaperRouter.delete("/delete/:id", isAuthenticated, deleteMCQPaper);

mcqPaperRouter.get("/get/:id", isAuthenticated, paymentAccessMiddleware, getMCQPaper);
// 
mcqPaperRouter.get("/list", isAuthenticated, paymentAccessMiddleware, listMCQPapers);
mcqPaperRouter.get("/questions/:id", isAuthenticated, paymentAccessMiddleware, getPaperQuestions);
mcqPaperRouter.get("/list-with-questions", isAuthenticated, paymentAccessMiddleware, listMCQPapersWithQuestions);

mcqPaperRouter.post("/add-question/:id", isAuthenticated, addQuestionToPaper);
mcqPaperRouter.post(
  "/remove-question/:id",
  isAuthenticated,
  removeQuestionFromPaper
);

export default mcqPaperRouter;
