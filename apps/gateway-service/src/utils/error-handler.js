import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";

export const handleGatewayError = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (!(err instanceof ErrorHandler)) {
    const message = err.message || "Internal Server Error";
    error = new ErrorHandler(
      message,
      err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err.errorCode || "GATEWAY_ERROR",
    );
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    code: error.errorCode || "INTERNAL_ERROR",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
