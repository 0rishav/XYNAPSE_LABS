import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createCourseIntro,
  deleteCourseIntro,
  getActiveCourseIntro,
  getCourseIntro,
  updateCourseIntro,
} from "../controllers/courseIntro.js";

const courseIntroRouter = express.Router();

courseIntroRouter.get("/user/get", isAuthenticated, getActiveCourseIntro);

// adminRoutes
courseIntroRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  createCourseIntro
);

courseIntroRouter.get("/get", isAuthenticated, getCourseIntro);
courseIntroRouter.put(
  "/:id/update",
  isAuthenticated,
  hasRole("lab_admin"),
  updateCourseIntro
);
courseIntroRouter.delete(
  "/:id/delete",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteCourseIntro
);

export default courseIntroRouter;
