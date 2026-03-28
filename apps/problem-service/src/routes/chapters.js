import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createChapter,
  deleteChapter,
  getAllChapters,
  getChapterById,
  hardDeleteChapter,
  incrementEngagement,
  manageResources,
  reorderChapters,
  restoreChapter,
  searchChapters,
  setAvailabilityMode,
  toggleChapterStatus,
  updateChapter,
  updateVisibility,
} from "../controllers/chapters.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";
// import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";

const chapterRouter = express.Router();

chapterRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("thumbnail"),
  createChapter
);

chapterRouter.put(
  "/update/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("thumbnail"),
  updateChapter
);

chapterRouter.put(
  "/reorder",
  isAuthenticated,
  hasRole("lab_admin"),
  reorderChapters
);

/**
 * @swagger
 * /chapters/all:
 *   get:
 *     summary: Get all chapters (Paginated, Filterable)
 *     tags: [Chapters]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page (default 10)
 *       - in: query
 *         name: labId
 *         schema:
 *           type: string
 *         description: Filter by lab ID
 *       - in: query
 *         name: labsectionId
 *         schema:
 *           type: string
 *         description: Filter by lab section ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: active
 *         description: Filter by chapter status
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           example: beginner
 *         description: Filter by chapter level
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           example: public
 *         description: Filter by visibility status
 *     responses:
 *       200:
 *         description: Chapters fetched successfully
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
 *                   example: Chapters fetched successfully
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64fc5a12e8c123456789abcd"
 *                       title:
 *                         type: string
 *                         example: "Introduction to Java"
 *                       description:
 *                         type: string
 *                         example: "Basics of Java programming"
 *                       labId:
 *                         type: string
 *                         example: "64fc5a12e8c123456789abce"
 *                       labsectionId:
 *                         type: string
 *                         example: "64fc5a12e8c123456789abcf"
 *                       status:
 *                         type: string
 *                         example: "active"
 *                       level:
 *                         type: string
 *                         example: "beginner"
 *                       visibility:
 *                         type: string
 *                         example: "public"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid pagination values or invalid IDs
 *       401:
 *         description: Unauthorized
 */
chapterRouter.get(
  "/all",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllChapters
);

chapterRouter.get("/all-user", isAuthenticated, getAllChapters);

// Public listing for guests: show published chapters with availability active or disabled (hidden excluded)
chapterRouter.get("/all-public", getAllChapters);

/**
 * @swagger
 * /chapters/search-chapter:
 *   get:
 *     summary: Search chapters by text
 *     tags: [Chapters]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           example: java basics
 *         required: true
 *         description: The search term to look for in chapters
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of results per page (default 10)
 *     responses:
 *       200:
 *         description: Chapters fetched successfully based on search query
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
 *                   example: Chapters fetched !!
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64fc5a12e8c123456789abcd"
 *                       title:
 *                         type: string
 *                         example: "Java Basics"
 *                       description:
 *                         type: string
 *                         example: "Introduction to Java syntax"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Search query is required
 *       401:
 *         description: Unauthorized
 */
chapterRouter.get("/search-chapter", isAuthenticated, searchChapters);

/**
 * @swagger
 * /chapters/{id}:
 *   get:
 *     summary: Get chapter details by ID
 *     tags: [Chapters]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64fc5a12e8c123456789abcd
 *         description: The unique ID of the chapter
 *     responses:
 *       200:
 *         description: Chapter fetched successfully
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
 *                   example: Chapter fetched successfully
 *                 chapter:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64fc5a12e8c123456789abcd
 *                     title:
 *                       type: string
 *                       example: Introduction to Java
 *                     description:
 *                       type: string
 *                       example: This chapter covers Java basics
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid Chapter ID
 *       404:
 *         description: Chapter not found
 *       401:
 *         description: Unauthorized
 */
chapterRouter.get("/:id", isAuthenticated, getChapterById);

chapterRouter.patch(
  "/restore/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  restoreChapter
);

chapterRouter.patch(
  "/delete/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteChapter
);

chapterRouter.delete(
  "/hard-delete/:id",
  hasRole("lab_admin"),
  hardDeleteChapter
);

chapterRouter.patch(
  "/toggle/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  toggleChapterStatus
);

// Lock/Unlock/Hide a chapter's availability mode
chapterRouter.patch(
  "/availability-mode/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  setAvailabilityMode
);

chapterRouter.patch(
  "/visibility/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  updateVisibility
);

chapterRouter.patch("/increment/:id", isAuthenticated, incrementEngagement);

chapterRouter.patch("/manager-resource/:id", isAuthenticated, manageResources);

export default chapterRouter;
