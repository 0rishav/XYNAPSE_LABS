import jwt from "jsonwebtoken";
import ErrorHandler from "../errors/ErrorHandler.js";
import { CatchAsyncError } from "./CatchAsyncError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ERROR_CODES } from "../constants/errorCode.js";

export const isAuthenticated = CatchAsyncError(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ErrorHandler(
      "Authentication required. Please login.",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_REQUIRED,
    );
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = {
      _id: decodedToken._id,
      role: decodedToken.role,
      tokenVersion: decodedToken.tokenVersion,
    };

    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Access token expired"
        : "Invalid token";
    const code =
      error.name === "TokenExpiredError"
        ? ERROR_CODES.TOKEN_EXPIRED
        : ERROR_CODES.INVALID_TOKEN;

    throw new ErrorHandler(message, HTTP_STATUS.UNAUTHORIZED, code);
  }
});

export const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          "Access denied",
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN,
        ),
      );
    }
    next();
  };
};
