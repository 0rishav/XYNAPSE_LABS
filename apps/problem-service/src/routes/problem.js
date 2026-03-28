import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  getProblemOfTheDay,
  getProblemBrief,
  getProblemsWithStatus,

} from "../controllers/problem.js";
import { getAllTestCases, bulkDeleteTestCases } from "../controllers/testCases.js";
// import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";


const problemRouter = express.Router();


// Admin: list all testcases for a problem
problemRouter.get(
  "/:problemId([0-9a-fA-F]{24})/testcases",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllTestCases
);

// Admin: bulk delete testcases for a problem
problemRouter.delete(
  "/:problemId([0-9a-fA-F]{24})/testcases",
  isAuthenticated,
  hasRole("lab_admin"),
  bulkDeleteTestCases
);

problemRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  createProblem
);

// Update an existing problem (Admin)
problemRouter.put(
  "/update/:id([0-9a-fA-F]{24})",
  isAuthenticated,
  hasRole("lab_admin"),
  updateProblem
);

// Delete a problem (Admin)
problemRouter.delete(
  "/:problemId([0-9a-fA-F]{24})",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteProblem
);

// Admin-only list of all problems is defined later with hasRole('lab_admin').
// Removed duplicate public route to avoid middleware conflicts.

// Problem of the Day
problemRouter.get("/of-the-day", isAuthenticated, getProblemOfTheDay);

problemRouter.get("/brief/:problemId([0-9a-fA-F]{24})", isAuthenticated, getProblemBrief);

// Problems with server-side status + counts (supports filters/pagination)
problemRouter.get("/with-status", isAuthenticated,getProblemsWithStatus);

/**
 * @swagger
 * /problem/all-problems:
 *   get:
 *     summary: Get all problems
 *     description: Returns a list of all problems. Only accessible to lab admins.
 *     tags:
 *       - Problems
 *     security:
 *       - accessTokenAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all problems.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 problems:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Problem'
 *       401:
 *         description: Unauthorized - User not logged in or token invalid.
 *       403:
 *         description: Forbidden - User does not have lab_admin role.
 */
problemRouter.get(
  "/all-problems",
  isAuthenticated,
  getAllProblems
);

// Constrain problemId to valid MongoDB ObjectId to avoid clashing with static routes like /of-the-day
// Public (auth required): get problem by id
problemRouter.get("/:problemId([0-9a-fA-F]{24})", isAuthenticated, getProblemById);

problemRouter.get(
  "/:problemId([0-9a-fA-F]{24})",
  isAuthenticated,
  hasRole("lab_admin"),
  getProblemById
);


export default problemRouter;