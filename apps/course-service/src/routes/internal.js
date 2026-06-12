import express from "express"
import { verifyChapterInternal } from "../controllers/chapter.js"
import { verifyCourse } from "../controllers/courses.js";

const internalRouter  = express.Router()

internalRouter.get("/verify/:id",verifyChapterInternal);

internalRouter.get("/course/:courseId",verifyCourse);

export default internalRouter;