import express from "express";
import { createCategory, getAllCategories, updateCategory } from "../controllers/category.js";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";

const categoryRouter = express.Router();

categoryRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  createCategory
);

categoryRouter.put(
  "/update/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  updateCategory
);

/**
 * @swagger
 * /category/all-categories:
 *   get:
 *     summary: Get all categories (Paginated)
 *     tags: [Category]
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: labId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lab
 *       - in: query
 *         name: labSectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the lab section
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination (default 1)
 *     responses:
 *       200:
 *         description: Categories fetched successfully
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
 *                   example: Categories fetched from DB
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Java Basics"
 *                       slug:
 *                         type: string
 *                         example: "java-basics"
 *                       description:
 *                         type: string
 *                         example: "Basic Java programming concepts"
 *                       icon:
 *                         type: string
 *                         example: "icon-url"
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       parentCategory:
 *                         type: string
 *                         example: "64fc5a12e8c123456789abcd"
 *                       metaTitle:
 *                         type: string
 *                         example: "Learn Java Basics"
 *                       metaDescription:
 *                         type: string
 *                         example: "Java basics for beginners"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   example: 45
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Missing or invalid labId / labSectionId
 *       401:
 *         description: Unauthorized
 */
categoryRouter.get(
  "/all-categories",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllCategories
);

categoryRouter.get(
  "/all-categories-user",
  isAuthenticated,
  getAllCategories
);

export default categoryRouter;
