import express from "express";
// import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";
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
  updatePaperStatus,
} from "../controllers/mcqPaper.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";

const mcqPaperRouter = express.Router();

mcqPaperRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  upload.single("thumbnail"),
  createMCQPaper,
);

mcqPaperRouter.put(
  "/update/:id",
  attachRequestId,
  isAuthenticated,
  upload.single("thumbnail"),
  updateMCQPaper,
);

mcqPaperRouter.delete("/delete/:id", attachRequestId, isAuthenticated, deleteMCQPaper);

// user side

mcqPaperRouter.get(
  "/get/:id",
  attachRequestId,
  isAuthenticated,
  // paymentAccessMiddleware,
  getMCQPaper,
);

// user side

mcqPaperRouter.get(
  "/list",
  attachRequestId,
  isAuthenticated,
  // paymentAccessMiddleware,
  listMCQPapers,
);

// user side

mcqPaperRouter.get(
  "/questions/:id",
  attachRequestId,
  isAuthenticated,
  // paymentAccessMiddleware,
  getPaperQuestions,
);

mcqPaperRouter.patch(
  "/:id/status",
  attachRequestId,
  isAuthenticated,
  // paymentAccessMiddleware,
  updatePaperStatus,
);

mcqPaperRouter.get(
  "/list-with-questions",
  isAuthenticated,
  // paymentAccessMiddleware,
  listMCQPapersWithQuestions,
);

mcqPaperRouter.post("/add-question/:id", isAuthenticated, addQuestionToPaper);
mcqPaperRouter.post(
  "/remove-question/:id",
  isAuthenticated,
  removeQuestionFromPaper,
);

export default mcqPaperRouter;
