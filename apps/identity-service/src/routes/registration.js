import express from "express";
import {
  createProjectRegistration,
  deleteProjectRegistration,
  getAllProjectRegistrations,
} from "../controllers/registration.js";
import { isAuthenticated } from "../../../../packages/common/src/middleware/auth.js";

const registrationRouter = express.Router();

registrationRouter.post(
  "/project-registration",
  isAuthenticated,
  createProjectRegistration,
);

registrationRouter.get(
  "/all-project-registration",
  isAuthenticated,
  getAllProjectRegistrations,
);

registrationRouter.delete(
  "/delete-project-registration/:id",
  isAuthenticated,
  deleteProjectRegistration,
);

export default registrationRouter;
