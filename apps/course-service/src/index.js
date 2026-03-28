import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { ErrorMiddleware } from "../../../packages/common/src/middleware/error.js";
import { swaggerSpec } from "../../../packages/common/src/infra/swagger.js";

// === ROUTE IMPORTS (Enabled) ===
import categoryRouter from "./routes/category.js";
import courseRouter from "./routes/courses.js";
import chapterRouter from "./routes/chapter.js";
import contentRouter from "./routes/content.js";
import interactionRouter from "./routes/interaction.js";
import contentInteractionRouter from "./routes/contentInteraction.js";
import pricingRouter from "./routes/coursePricing.js";
import progressRouter from "./routes/progress.js";
import reviewRouter from "./routes/review.js";
import reviewReplyRouter from "./routes/reviewReply.js";
import courseIntroRouter from "./routes/courseIntro.js";
import faqRouter from "./routes/courseFaq.js";
import { seedChapters } from "./utils/insertChapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });

console.log("App starting...");

const app = express();
const server = http.createServer(app);
const PORT = process.env.COURSE_PORT || 5001;
const ENVIRONMENT = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("Database connected!");

    // seedChapters()

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
    app.get("/health", (req, res) =>
      res.status(200).json({ success: true, message: "API WORKING" }),
    );

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        swaggerOptions: { withCredentials: true },
      }),
    );

    app.use("/api/v1/course", courseRouter);
    app.use("/api/v1/category", categoryRouter);
    app.use("/api/v1/chapter", chapterRouter);
    app.use("/api/v1/content", contentRouter);
    app.use("/api/v1/interaction", interactionRouter);
    app.use("/api/v1/contentInteraction", contentInteractionRouter);
    app.use("/api/v1/coursePricing", pricingRouter);
    app.use("/api/v1/progress", progressRouter);
    app.use("/api/v1/review", reviewRouter);
    app.use("/api/v1/reviewReply", reviewReplyRouter);
    app.use("/api/v1/courseIntro", courseIntroRouter);
    app.use("/api/v1/faq", faqRouter);

    app.all("*", (req, res, next) => {
      const err = new Error(`Route ${req.originalUrl} not found`);
      err.statusCode = 404;
      next(err);
    });

    app.use(ErrorMiddleware);

    server.listen(PORT, () => {
      console.log(`Course Server is running on PORT ${PORT}`);
      console.log(`Environment: ${ENVIRONMENT}`);
    });
  } catch (error) {
    console.error("💥 STARTUP ERROR 💥");
    console.error(error.stack || error);
    process.exit(1);
  }
};

startServer();
