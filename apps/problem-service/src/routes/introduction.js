import express from "express";
import { isAuthenticated, hasRole } from "../middleware/auth.js";
import { 
  createIntroduction, 
  getIntroduction, 
  getAllIntroductions,
  updateIntroduction,
  deleteIntroduction
} from "../controllers/introduction.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";

const introductionRouter = express.Router();

introductionRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  upload.array("icon"),
  createIntroduction
);

introductionRouter.get(
  "/all",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllIntroductions
);

introductionRouter.put(
  "/update/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  updateIntroduction
);

introductionRouter.delete(
  "/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteIntroduction
);

introductionRouter.get(
  "/:labId/:sectionId",
  isAuthenticated,
  getIntroduction
);

export default introductionRouter;
