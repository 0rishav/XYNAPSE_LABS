import express from "express"
import { createInternshipRegistration, deleteInternshipRegistration, getAllInternshipRegistrations, getInternshipRegistrationById, markInternshipRegistrationViewed, updateInternshipRegistrationStatus } from "../controllers/internship.js";
import { hasRole, isAuthenticated } from "../middleware/auth.js";


const internshipRouter = express.Router();

// Public-facing creation (authenticated user)
internshipRouter.post("/internship-registration", isAuthenticated, createInternshipRegistration)

// Admin endpoints
internshipRouter.get("/get-internship", isAuthenticated, hasRole("lab_admin"), getAllInternshipRegistrations)
internshipRouter.get("/internship/:id", isAuthenticated, hasRole("lab_admin"), getInternshipRegistrationById)
internshipRouter.patch("/internship/:id/status", isAuthenticated, hasRole("lab_admin"), updateInternshipRegistrationStatus)
internshipRouter.post("/internship/:id/viewed", isAuthenticated, hasRole("lab_admin"), markInternshipRegistrationViewed)

internshipRouter.delete("/delete-internship/:id", isAuthenticated, hasRole("lab_admin"), deleteInternshipRegistration)


// userRouter.get("/me",isAuthenticated,authenticateMe)

export default internshipRouter