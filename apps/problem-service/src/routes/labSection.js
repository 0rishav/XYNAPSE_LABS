import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createLabSection,
  deleteLabSection,
  getAllLabSections,
  getMinimalSectionsByLab,
  updateLabSection,
} from "../controllers/labSection.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";

const labSectionRouter = express.Router();

labSectionRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  createLabSection
);

labSectionRouter.put(
  "/update/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.single("icon"),
  updateLabSection
);

labSectionRouter.get("/all/:labId", isAuthenticated, getAllLabSections);

// labSectionRouter.get("/all/:labId", isAuthenticated, getAllLabSections);

labSectionRouter.get("/:labId", isAuthenticated, getMinimalSectionsByLab);

labSectionRouter.delete(
  "/:id",
  hasRole("lab_admin"),
  isAuthenticated,
  deleteLabSection
);

export default labSectionRouter;
