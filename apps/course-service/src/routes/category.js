import express from "express";

import { upload } from "../../../../packages/common/src/infra/multerConfig.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../../../packages/common/src/validation/categorySchema.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  hardDeleteCategory,
  softDeleteCategory,
  toggleCategoryStatus,
  updateCategory,
} from "../controllers/category.js";

const categoryRouter = express.Router();

categoryRouter.post(
  "/create",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  sanitizeRequest,
  validateRequest(createCategorySchema),
  createCategory,
);

categoryRouter.put(
  "/update/:id",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  sanitizeRequest,
  validateRequest(updateCategorySchema),
  updateCategory,
);

categoryRouter.patch(
  "/status/:id",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  toggleCategoryStatus,
);

categoryRouter.patch(
  "/soft-delete/:id",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  softDeleteCategory,
);

categoryRouter.delete(
  "/hard-delete/:id",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  hardDeleteCategory,
);

categoryRouter.get(
  "/admin/all",
  attachRequestId,
  isAuthenticated,
  hasRole("lab_admin"),
  getAllCategories,
);

categoryRouter.get("/public/all", attachRequestId, getAllCategories);

categoryRouter.get("/detail/:slug", attachRequestId, getCategoryBySlug);

export default categoryRouter;
