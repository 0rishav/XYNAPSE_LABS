import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  bulkUploadTestCases,
  createTestCase,
  getAllTestCases,
  getVisibleTestCases,
} from "../controllers/testCases.js";

const testCasesRouter = express.Router();

testCasesRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  createTestCase
);

testCasesRouter.post(
  "/bulk-upload/:problemId",
  isAuthenticated,
  hasRole("lab_admin"),
  bulkUploadTestCases
);

testCasesRouter.get(
  "/visible-testcases/:problemId",
  isAuthenticated,
  hasRole("lab_admin"),
  getVisibleTestCases
);

testCasesRouter.get(
  "/all-testcases/:problemId",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllTestCases
);

export default testCasesRouter;
