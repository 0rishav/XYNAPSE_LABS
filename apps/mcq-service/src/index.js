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
import mcqPaperRouter from "./routes/mcqPaper.js";
import mcqQuestionRouter from "./routes/mcqQuestion.js";
import mcqSubmissionRouter from "./routes/mcqSubmission.js";
import { publishAllQuestions, seedDatabase } from "./constants/seed.js";
// import mcqRouter from "./routes/mcq.js";

dotenv.config({ path: path.resolve("../../.env") });
console.log("App starting...");

const app = express();
const server = http.createServer(app);
const PORT = process.env.MCQ_PORT || 5001;
const ENVIRONMENT = process.env.NODE_ENV;

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

    app.use("/api/v1/mcqPaper", mcqPaperRouter);
    app.use("/api/v1/mcqQuestion", mcqQuestionRouter);
    app.use("/api/v1/mcqSubmission", mcqSubmissionRouter);

    // process.on("uncaughtException", (err) => {
    //   console.error("FATAL ERROR: Uncaught Exception! Shutting down...");
    //   console.error(err.name, err.message);
    //   process.exit(1); // Exit with failure
    // });

    // process.on("unhandledRejection", (err) => {
    //   console.error(
    //     "FATAL ERROR: Unhandled Promise Rejection! Shutting down...",
    //   );
    //   console.error(err.name, err.message);
    //   process.exit(1);
    // });

    // 404 handler
    app.all("*", (req, res, next) => {
      const err = new Error(`Route ${req.originalUrl} not found`);
      err.statusCode = 404;
      next(err);
    });

    app.use(ErrorMiddleware);

    server.listen(PORT, () => {
      console.log(`MCQ Server is running on PORT ${PORT}`);
      console.log(`Environment: ${ENVIRONMENT}`);
    });
  } catch (error) {
    console.error("💥 STARTUP ERROR 💥");
    console.error(error.stack || error);
    process.exit(1);
  }
};

startServer();
