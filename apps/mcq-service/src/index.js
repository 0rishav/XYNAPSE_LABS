import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./config/db.js";
import { ErrorMiddleware } from "../../../packages/common/src/middleware/error.js";
import { swaggerSpec } from "../../../packages/common/src/infra/swagger.js";
import projectRouter from "./routes/project.js";
import introductionRouter from "./routes/introduction.js";
import internshipRouter from "./routes/internship.js";
import labRouter from "./routes/lab.js";
import faqRouter from "./routes/faq.js";
import labSectionRouter from "./routes/labSection.js";
import courseRouter from "./routes/courses.js";
import courseIntroRouter from "./routes/courseIntro.js";
import categoryRouter from "./routes/category.js";
import problemRouter from "./routes/problem.js";
import chapterRouter from "./routes/chapters.js";
import contentRouter from "./routes/content.js";
import reviewRouter from "./routes/reviewRoute.js";

dotenv.config({ path: path.resolve("./.env") });

// Uske baad root env bhi load kar lo
dotenv.config({ path: path.resolve("../../.env") });
console.log("App starting...");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("Database connected!");

    const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Not allowed by CORS: ${origin}`));
        }
      },
      credentials: true,
      methods: "GET,POST,PUT,DELETE,PATCH",
      allowedHeaders: "Content-Type,Authorization,Origin,Accept",
    };

    app.use(cookieParser());
    app.use(cors(corsOptions));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use(morgan("dev"));

    // ========== ROUTES ==========
    app.get("/", (req, res) =>
      res.status(200).json({ success: true, message: "API WORKING" }),
    );

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        swaggerOptions: { withCredentials: true },
      }),
    );

    // Your existing routers

    app.use("/api/v1/project", projectRouter);
    // app.use("/api/v1/favorite", favoriteRouter);
    app.use("/api/v1/introduction", introductionRouter);
    app.use("/api/v1/internship", internshipRouter);
    app.use("/api/v1/lab", labRouter);
    app.use("/api/v1/faq", faqRouter);
    app.use("/api/v1/labsection", labSectionRouter);
    app.use("/api/v1/courseIntro", courseIntroRouter);
    app.use("/api/v1/course", courseRouter);
    app.use("/api/v1/category", categoryRouter);
    app.use("/api/v1/problem", problemRouter);
    app.use("/api/v1/chapters", chapterRouter);
    app.use("/api/v1/content", contentRouter);
    app.use("/api/v1/review", reviewRouter);

    // 404 handler
    app.all("*", (req, res, next) => {
      const err = new Error(`Route ${req.originalUrl} not found`);
      err.statusCode = 404;
      next(err);
    });

    app.use(ErrorMiddleware);

    server.listen(PORT, () => {
      console.log(`Course Server is running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("💥 STARTUP ERROR 💥");
    console.error(error.stack || error);
    process.exit(1);
  }
};

startServer();
