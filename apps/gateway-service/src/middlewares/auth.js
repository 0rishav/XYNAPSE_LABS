import jwt from "jsonwebtoken";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { config } from "../config/index.js";

export const gatewayAuth = (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(
        new ErrorHandler(
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.AUTH_REQUIRED
        )
      );
    }

    const decoded = jwt.verify(token, config.secrets.accessToken);

    req.headers["x-user-id"] = decoded._id;
    req.headers["x-user-role"] = decoded.role;
    req.headers["x-user-token-version"] = decoded.tokenVersion;

    req.user = decoded;

    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token expired"
        : "Invalid token";

    const code =
      error.name === "TokenExpiredError"
        ? ERROR_CODES.TOKEN_EXPIRED
        : ERROR_CODES.INVALID_TOKEN;

    return next(
      new ErrorHandler(
        message,
        HTTP_STATUS.UNAUTHORIZED,
        code
      )
    );
  }
};