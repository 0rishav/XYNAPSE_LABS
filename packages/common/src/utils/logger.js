import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

const logsDir = path.resolve("logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const devConsoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return `[${timestamp}] ${level}: ${stack || message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  }),
);

const currentDir = process.cwd();
const serviceNameFromFolder = currentDir.split(/[\\/]/).pop();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: baseFormat,
  defaultMeta: {
    service:
      process.env.SERVICE_NAME || serviceNameFromFolder || "unknown-service",
  },
  transports: [
    new winston.transports.Console({
      format: isProduction ? baseFormat : devConsoleFormat,
    }),

    new DailyRotateFile({
      filename: path.join(logsDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    }),

    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      zippedArchive: true,
    }),
  ],

  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, "exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
    }),
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, "rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
    }),
  ],
});

export default logger;
