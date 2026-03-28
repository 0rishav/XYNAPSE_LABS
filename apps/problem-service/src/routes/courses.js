import express from "express";
import { hasRole, isAuthenticated } from "../middleware/auth.js";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCoursesByCategory,
  updateCourse,
} from "../controllers/courses.js";
import { createUploadMiddleware } from "../../../../packages/common/src/infra/multerConfig.js";

const courseRouter = express.Router();

export const uploadCourseFiles = createUploadMiddleware([
  { name: "banner", maxCount: 1 },
  { name: "icon", maxCount: 1 },
]);

courseRouter.post(
  "/create",
  isAuthenticated,
  hasRole("lab_admin"),
  uploadCourseFiles,
  createCourse
);
courseRouter.get(
  "/all-courses",
  isAuthenticated,
  hasRole("lab_admin"),
  getAllCourses
);
courseRouter.get("/all-courses-user", isAuthenticated, getAllCourses);

courseRouter.get("/category-course/:categoryId", isAuthenticated, getCoursesByCategory);


courseRouter.put(
  "/update/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  uploadCourseFiles,
  updateCourse
);
courseRouter.delete(
  "/remove/:id",
  isAuthenticated,
  hasRole("lab_admin"),
  deleteCourse
);

export default courseRouter;
