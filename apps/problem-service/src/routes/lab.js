import express from "express";
import {
  createLab,
  deleteLab,
  getAdvancedLabs,
  getAllLabs,
  getHotLabs,        //  ADDED: Import the missing hotLabs function
  getLabById,
  getMinimalLabs,
  getPopularLabs,
  updateLab,
} from "../controllers/lab.js";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";
// import { paymentAccessMiddleware } from "../middleware/paymentMiddleware.js";

const labRouter = express.Router();

labRouter.post("/create", isAuthenticated, hasRole("lab_admin"), upload.single("icon"), createLab);

/**
 * @swagger
 * /lab/all-labs:
 *   get:
 *     summary: Get all active labs
 *     tags: [Labs]
 *     security:
 *       - accessTokenAuth: []
 *     responses:
 *       200:
 *         description: Labs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 labs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lab'
 */
labRouter.get("/all-labs", getAllLabs);

labRouter.get("/minimal-labs", isAuthenticated, getMinimalLabs);

/**
 * @swagger
 * /lab/hot-labs:
 *   get:
 *     summary: Get all hot labs
 *     tags: [Labs]
 *     responses:
 *       200:
 *         description: Hot labs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 labs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lab'
 */
labRouter.get("/hot-labs", getHotLabs);  // ✅ FIXED: Now uses getHotLabs instead of getPopularLabs

labRouter.get("/advanced-labs", getAdvancedLabs);

labRouter.get("/:id", isAuthenticated,  getLabById);

labRouter.put("/update/:id", isAuthenticated, hasRole("lab_admin"), upload.single("icon"), updateLab);

labRouter.delete("/delete/:id", isAuthenticated, hasRole("lab_admin"), deleteLab);

export default labRouter;
