import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const rootEnvPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: rootEnvPath });

export const config = {
  port: process.env.GATEWAY_PORT || 8000,
  env: process.env.NODE_ENV || "development",
  secrets: {
    accessToken: process.env.ACCESS_TOKEN_SECRET,
  },
  services: {
    identity: process.env.IDENTITY_SERVICE_URL || "http://localhost:8001",
    course: process.env.COURSE_SERVICE_URL || "http://localhost:8002",
    mcq: process.env.MCQ_SERVICE_URL || "http://localhost:8003",
    payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:8003",
    submission: process.env.SUBMISSION_SERVICE_URL || "http://localhost:8004",
    judge: process.env.JUDGE_SERVICE_URL || "http://localhost:8005",
  },
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  },
};

if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error("ERROR: Root .env load nahi ho payi, check path!");
}
