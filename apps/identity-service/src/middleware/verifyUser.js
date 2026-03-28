import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import User from "../models/userModal.js";

export const validateUserStatus = CatchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("tokenVersion isDisabled");

  if (!user) {
    throw new ErrorHandler("User no longer exists", HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  if (user.isDisabled) {
    throw new ErrorHandler("Account disabled", HTTP_STATUS.FORBIDDEN, ERROR_CODES.USER_DISABLED);
  }

  if (req.user.tokenVersion !== user.tokenVersion) {
    logger.warn(`[Security] Stale token for user: ${user._id}`);
    throw new ErrorHandler("Session expired", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED);
  }

  next();
});