import express from "express";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getProjectHourStats,
  getProjectProgressStats,
  getProjectStatsSummary,
  hardDeleteProject,
  restoreProject,
  updateProject,
  updateProjectProgress,
  updateProjectStatus,
} from "../controllers/project.js";
import { hasRole, isAuthenticated } from "../middleware/auth.js";

const projectRouter = express.Router();

projectRouter.post(
  "/create",
  isAuthenticated,
 
  createProject
);

/**
 * @swagger
 * /project/all-projects:
 *   get:
 *     summary: Get all projects for the logged-in user
 *     description: Fetches a paginated list of projects belonging to the authenticated user, with optional filtering and sorting.
 *     tags:
 *       - Projects
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of projects per page.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *         description: Field to sort by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: desc
 *         description: Sort order.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: landing page
 *         description: Search term for project titles.
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           example: high
 *         description: Filter by project priority.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: in-progress
 *         description: Filter by project status.
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           example: frontend,backend
 *         description: Comma-separated tags to filter projects.
 *     responses:
 *       200:
 *         description: List of projects successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project Fetch !!
 *                 totalProjects:
 *                   type: integer
 *                   example: 25
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized - user not logged in.
 */
projectRouter.get("/all-projects", isAuthenticated, getAllProjects);

/**
 * @swagger
 * /project/summary:
 *   get:
 *     summary: Get project statistics summary
 *     description: Returns total projects, projects grouped by status, and projects grouped by priority. Only non-deleted projects are counted.
 *     tags:
 *       - Projects
 *     security:
 *       - accessTokenAuth: []
 *     responses:
 *       200:
 *         description: Project statistics summary successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project Status Summary !!
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                       example: 45
 *                     projectsPerStatus:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         in-progress: 20
 *                         completed: 15
 *                         pending: 10
 *                     projectsPerPriority:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         high: 12
 *                         medium: 20
 *                         low: 13
 *       401:
 *         description: Unauthorized - user not logged in.
 */
projectRouter.get("/summary", isAuthenticated, getProjectStatsSummary);

/**
 * @swagger
 * /project/progress-stats:
 *   get:
 *     summary: Get project progress distribution stats
 *     description: Returns the number of projects in different progress percentage ranges.
 *     tags:
 *       - Projects
 *     security:
 *       - accessTokenAuth: []
 *     responses:
 *       200:
 *         description: Success - Project progress stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project Stats !!
 *                 data:
 *                   type: object
 *                   properties:
 *                     progressDistribution:
 *                       type: object
 *                       example:
 *                         "0": 2
 *                         "20": 5
 *                         "40": 3
 *                         "60": 7
 *                         "80": 4
 *                         "100": 6
 *                         "100+": 1
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 *       500:
 *         description: Internal Server Error
 */
projectRouter.get("/progress-stats", isAuthenticated, getProjectProgressStats);


/**
 * @swagger
 * /project/hour-stats:
 *   get:
 *     summary: Get total estimated and actual project hours
 *     description: Returns total estimated hours and actual hours for all projects (excluding deleted ones).
 *     tags:
 *       - Projects
 *     security:
 *       - accessTokenAuth: []
 *     responses:
 *       200:
 *         description: Project hours statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project Hours Stats !!
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimatedHours:
 *                       type: number
 *                       example: 150
 *                     actualHours:
 *                       type: number
 *                       example: 120
 *       401:
 *         description: Unauthorized
 */
projectRouter.get("/hour-stats", isAuthenticated, getProjectHourStats);


projectRouter.put(
  "/update/:id",
  isAuthenticated,

  updateProject
);

projectRouter.get("/:id", isAuthenticated, getProjectById);

projectRouter.patch(
  "/:id",
  isAuthenticated,
  // hasRole("lab_admin"),
  deleteProject
);

projectRouter.patch(
  "/:id/restore",
  isAuthenticated,
  hasRole("lab_admin"),
  restoreProject
);

projectRouter.delete(
  "/:id/hard-delete",
  isAuthenticated,
  hasRole("super_admin"),
  hardDeleteProject
);

projectRouter.patch(
  "/:id/status",
  isAuthenticated,
  hasRole("lab_admin"),
  updateProjectStatus
);

projectRouter.patch(
  "/:id/progress",
  isAuthenticated,
  hasRole("lab_admin"),
  updateProjectProgress
);

export default projectRouter;
