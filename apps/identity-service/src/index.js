import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import userRouter from "./routes/user.js";
import registrationRouter from "./routes/registration.js";
import swaggerUi from "swagger-ui-express";
import streakRouter from "./routes/streak.js";
import { connectDB } from "./config/db.js";
import { ErrorMiddleware } from "../../../packages/common/src/middleware/error.js";
import { swaggerSpec } from "../../../packages/common/src/infra/swagger.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });
console.log("App starting...");

const app = express();
const server = http.createServer(app);
const PORT = process.env.IDENTITY_PORT || 5001;
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

    app.use("/api/v1/auth", userRouter);
    app.use("/api/v1/streak", streakRouter);
    app.use("/api/v1/registration", registrationRouter);

    // 404 handler
    app.all("*", (req, res, next) => {
      const err = new Error(`Route ${req.originalUrl} not found`);
      err.statusCode = 404;
      next(err);
    });

    app.use(ErrorMiddleware);

    server.listen(PORT, () => {
      console.log(`Identity Service is running on PORT ${PORT}`);
      console.log(`Environment: ${ENVIRONMENT}`);
    });
  } catch (error) {
    console.error("💥 STARTUP ERROR 💥");
    console.error(error.stack || error);
    process.exit(1);
  }
};

startServer();
