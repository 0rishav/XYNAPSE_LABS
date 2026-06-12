import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config/index.js";
import { httpLogger } from "./middlewares/logger.js";
import { courseProxy, identityProxy, mcqProxy } from "./middlewares/proxy.js";
import { gatewayAuth } from "./middlewares/auth.js";
import { handleGatewayError } from "./utils/error-handler.js";
import healthRouter from "./routes/health.js";

const app = express();

app.use(httpLogger);
app.use(cors({ 
  origin: [
    'https://lab.xynapsesystems.com', 
    'https://xynapsesystems.com', 
    'http://localhost:3000'
  ], 
  credentials: true 
}));
app.use(cookieParser());

app.use("/health", healthRouter);

/**
 * 🔥 IDENTITY ROUTES CONFIG
 */
const publicRoutes = [
  "/login",
  "/register",
  "/verify-2fa",
  "/new-password",
  "/verify-reset-otp",
  "/generate-reset-token",
  "/refresh-token",
  "/activate-user",
  "/google",
];

// Auth Guard + Proxy Logic
app.use(
  "/api/v1/auth",
  (req, res, next) => {
    const isPublic = publicRoutes.some((route) => req.path.startsWith(route));

    if (isPublic) {
      return next();
    }
    gatewayAuth(req, res, next);
  },
  identityProxy,
);

/**
 * 🎓 COURSE SERVICE ROUTES CONFIG
 */
const courseServicePaths = [
  "/api/v1/course",
  "/api/v1/category",
  "/api/v1/chapter",
  "/api/v1/content",
  "/api/v1/interaction",
  "/api/v1/contentInteraction",
  "/api/v1/coursePricing",
  "/api/v1/progress",
  "/api/v1/review",
  "/api/v1/reviewReply",
  "/api/v1/courseIntro",
  "/api/v1/faq",
];

app.use(courseServicePaths, gatewayAuth, courseProxy);

const mcqServicePaths = [
  "/api/v1/mcqPaper",
  "/api/v1/mcqQuestion",
  "/api/v1/mcqSubmission",
];

app.use(mcqServicePaths, gatewayAuth, mcqProxy);

app.use(handleGatewayError);

app.listen(config.port, () => {
  console.log(`\n Xynapse Gateway is BLASTING OFF!`);
  console.log(`Gateway Service is running on PORT: ${config.port}`);
  console.log(`Identity Service URL: ${config.services.identity}`);
  console.log(`Course Service URL: ${config.services.course}`);
  console.log(`MCQ Service URL: ${config.services.mcq}`);
  console.log(`Environment: ${config.env}\n`);
});
