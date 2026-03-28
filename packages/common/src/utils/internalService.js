import { ERROR_CODES } from "../constants/errorCode.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import ErrorHandler from "../errors/ErrorHandler.js";
import { CatchAsyncError } from "../middleware/CatchAsyncError.js";
import logger from "./logger.js";

export const isInternalService = CatchAsyncError(async (req, res, next) => {
  const internalSecret = req.headers["x-internal-secret"];

  if (
    !internalSecret ||
    internalSecret !== process.env.INTERNAL_SERVICE_SECRET
  ) {
    logger.warn(`[Security] Unauthorized internal service access attempt`);
    throw new ErrorHandler(
      "Unauthorized Internal Access",
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  next();
});
