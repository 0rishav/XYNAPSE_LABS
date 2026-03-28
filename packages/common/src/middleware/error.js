import { ERROR_CODES } from "../constants/errorCode.js";
import ErrorHandler from "../errors/ErrorHandler.js";
import logger from "../utils/logger.js";

export const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server Error";
  err.errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;

  if (err.name === "CastError") {
    const message = `Resource Not Found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400, ERROR_CODES.NOT_FOUND);
  }

  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 409, ERROR_CODES.CONFLICT);
  }

  if (err.name === "JsonWebTokenError") {
    const message = `Json web token is Invalid, Try Again`;
    err = new ErrorHandler(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  if (err.name === "TokenExpiredError") {
    const message = `Json web token is expired, Try Again`;
    err = new ErrorHandler(message, 401, ERROR_CODES.TOKEN_EXPIRED);
  }

  const requestId = res.locals.requestId || req.requestId || "N/A";

  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    requestId: requestId,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: {
      code: err.errorCode,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: requestId,
    },
  });
};
