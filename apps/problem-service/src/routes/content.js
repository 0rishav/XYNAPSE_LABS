import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createContent,
  deleteContent,
  getAllContents,
  getContentById,
  getRelatedContent,
  incrementView,
  searchContent,
  toggleBookmark,
  toggleLike,
  updateContent,
  updateContentVersion,
} from "../controllers/content.js";
import { uploadDocumentsMiddleware } from "../../../../packages/common/src/infra/multerConfig.js";

// import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";

const contentRouter = express.Router();

/**
 * @swagger
 * /content/create:
 *   post:
 *     summary: Create new content
 *     tags: [Content]
 *     security:
 *       - accessTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the content
 *                 example: "Introduction to JavaScript"
 *               description:
 *                 type: string
 *                 description: Short description of the content
 *                 example: "A beginner-friendly guide to JavaScript."
 *               slug:
 *                 type: string
 *                 description: Unique slug for the content
 *                 example: "introduction-to-javascript"
 *               body:
 *                 type: string
 *                 description: Main body of the content
 *                 example: "<p>JavaScript is a versatile language...</p>"
 *               code:
 *                 type: string
 *                 description: Code snippet associated with the content
 *                 example: "console.log('Hello, World!');"
 *               category:
 *                 type: string
 *                 description: Category of the content
 *                 example: "Programming"
 *               status:
 *                 type: string
 *                 description: Status of the content (e.g., draft, published)
 *                 example: "published"
 *               visibility:
 *                 type: string
 *                 description: Visibility of the content (e.g., public, private)
 *                 example: "public"
 *               chapterId:
 *                 type: string
 *                 description: ID of the associated chapter
 *                 example: "64fc5a12e8c123456789abcd"
 *               labId:
 *                 type: string
 *                 description: ID of the associated lab
 *                 example: "64fc5a12e8c123456789abce"
 *               labsectionId:
 *                 type: string
 *                 description: ID of the associated lab section
 *                 example: "64fc5a12e8c123456789abcf"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags associated with the content
 *                 example: ["javascript", "programming"]
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords for SEO
 *                 example: ["javascript", "guide", "beginner"]
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Thumbnail image for the content
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional attachments for the content
 *     responses:
 *       201:
 *         description: Content created successfully
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
 *                   example: "Content created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64fc5a12e8c123456789abcd"
 *                     title:
 *                       type: string
 *                       example: "Introduction to JavaScript"
 *                     slug:
 *                       type: string
 *                       example: "introduction-to-javascript"
 *                     body:
 *                       type: string
 *                       example: "<p>JavaScript is a versatile language...</p>"
 *                     thumbnail:
 *                       type: object
 *                       properties:
 *                         public_id:
 *                           type: string
 *                           example: "cloudinary-thumbnail-id"
 *                         secure_url:
 *                           type: string
 *                           example: "https://res.cloudinary.com/thumbnail.jpg"
 *                     attachments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           public_id:
 *                             type: string
 *                             example: "cloudinary-attachment-id"
 *                           secure_url:
 *                             type: string
 *                             example: "https://res.cloudinary.com/attachment.pdf"
 *       400:
 *         description: Validation error or missing fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Slug already exists
 *       500:
 *         description: Internal server error
 */

debugger
contentRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  uploadDocumentsMiddleware,
  createContent
);
debugger

// contentRouter.post(
//   "/create",
//   isAuthenticated,
//   hasRole("lab_admin"),
//   uploadDocumentsMiddleware,
//   createContent
// );

/**
 * @swagger
 * /content/search-content:
 *   get:
 *     summary: Search content by title, body, or tags
 *     tags: [Content]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: javascript
 *         description: Search keyword for content
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64fc5a12e8c123456789abcd
 *                       title:
 *                         type: string
 *                         example: Introduction to JavaScript
 *                       body:
 *                         type: string
 *                         example: JavaScript is a versatile language...
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["javascript", "programming"]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                 cached:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Search query is required
 *       401:
 *         description: Unauthorized
 */
contentRouter.get("/search-content", isAuthenticated, searchContent);

/**
 * @swagger
 * /content/all:
 *   get:
 *     summary: Get all content with optional filtering by lab, lab section, or chapter
 *     tags: [Content]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: labId
 *         required: false
 *         schema:
 *           type: string
 *           example: 64fc5a12e8c123456789abcd
 *         description: Filter contents by Lab ID
 *       - in: query
 *         name: labsectionId
 *         required: false
 *         schema:
 *           type: string
 *           example: 64fc5a12e8c123456789abce
 *         description: Filter contents by Lab Section ID
 *       - in: query
 *         name: chapterId
 *         required: false
 *         schema:
 *           type: string
 *           example: 64fc5a12e8c123456789abcf
 *         description: Filter contents by Chapter ID
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2
 *         description: Number of contents per page
 *     responses:
 *       200:
 *         description: Contents fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 source:
 *                   type: string
 *                   example: database
 *                 contents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 64fc5a12e8c123456789abc1
 *                       title:
 *                         type: string
 *                         example: Intro to Programming
 *                       body:
 *                         type: string
 *                         example: This is the content body...
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 2
 *                     pages:
 *                       type: integer
 *                       example: 25
 *       401:
 *         description: Unauthorized
 */
contentRouter.get(
  "/all",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllContents
);

contentRouter.get("/all-user", isAuthenticated, getAllContents);

contentRouter.put(
  "/update/:contentId",
  isAuthenticated,
  hasRole("lab_admin"),
  uploadDocumentsMiddleware,
  updateContent
);

/**
 * @swagger
 * /content/{id}:
 *   get:
 *     summary: Get content by ID
 *     description: Fetch a single content item by its MongoDB ObjectId. Uses Redis cache if available.
 *     tags:
 *       - Content
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the content
 *     responses:
 *       200:
 *         description: Content fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 source:
 *                   type: string
 *                   enum: [cache, database]
 *                 content:
 *                   $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid Content ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
contentRouter.get("/:id", isAuthenticated, getContentById);

contentRouter.patch(
  "/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteContent
);

contentRouter.patch("/increment/:id", isAuthenticated, incrementView);

contentRouter.patch("/like/:id", isAuthenticated, toggleLike);

contentRouter.patch("/bookmark/:id", isAuthenticated, toggleBookmark);

contentRouter.patch(
  "/version/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  updateContentVersion
);

contentRouter.patch("/related-content/:id", isAuthenticated, getRelatedContent);

export default contentRouter;
