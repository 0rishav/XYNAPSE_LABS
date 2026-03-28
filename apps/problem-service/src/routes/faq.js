import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createFAQ,
  deleteFAQ,
  getActiveFAQsForSection,
  getAllFAQs,
  getFAQsByLabId,
  toggleFAQStatus,
  updateFAQ,
} from "../controllers/faq.js";

const faqRouter = express.Router();

faqRouter.post("/create", isAuthenticated, hasRole("lab_admin"), createFAQ);

/**
 * @swagger
 * /faq/all-faq:
 *   get:
 *     summary: Get all FAQs
 *     description: Fetches a paginated list of FAQs. Supports filters like lab, labSection, isActive, and search.
 *     tags:
 *       - FAQ
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: lab
 *         schema:
 *           type: string
 *         description: Filter by lab ID
 *       - in: query
 *         name: labSection
 *         schema:
 *           type: string
 *         description: Filter by lab section ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true or false)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in FAQ question text
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: FAQs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FAQ'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
faqRouter.get("/all-faq", isAuthenticated, hasRole("lab_admin"), getAllFAQs);

faqRouter.get("/all-faqs", isAuthenticated, getAllFAQs);

/**
 * @swagger
 * /faq/lab/{labId}:
 *   get:
 *     summary: Get all FAQs for a specific lab
 *     tags: [FAQ]
 *     parameters:
 *       - in: path
 *         name: labId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lab to get FAQs for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of FAQs for the specified lab
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FAQ'
 */
faqRouter.get("/lab/:labId", isAuthenticated,getFAQsByLabId);

faqRouter.put("/update/:id", isAuthenticated, hasRole("lab_admin"), updateFAQ);

/**
 * @swagger
 * /faq/{labId}/sections/{sectionId}/faqs:
 *   get:
 *     summary: Get active FAQs for a specific lab section
 *     description: Fetches all active FAQs for a given lab and lab section, sorted by creation date (newest first).
 *     tags:
 *       - FAQ
 *     security:
 *       - accessTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: labId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lab
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lab section
 *     responses:
 *       200:
 *         description: Active FAQs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FAQ'
 *       400:
 *         description: Invalid Lab ID or Section ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only lab_admin can access
 */
faqRouter.get(
  "/:labId/sections/:sectionId/faqs",
  isAuthenticated,
  hasRole("lab_admin"),
  getActiveFAQsForSection
);

faqRouter.patch(
  "/:id/toggle",
  isAuthenticated,
  hasRole("lab_admin"),
  toggleFAQStatus
);

faqRouter.delete("/:id", isAuthenticated, hasRole("lab_admin"), deleteFAQ);

export default faqRouter;
