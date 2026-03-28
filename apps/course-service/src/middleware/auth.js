import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import jwt from "jsonwebtoken";
import User from "../../../identity-service/src/models/userModal.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401),
      );
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return next(new ErrorHandler("Invalid Token!", 404));
    }

    if (!user.refreshToken) {
      return next(
        new ErrorHandler("UnAuthorized Access. Please login again.", 401),
      );
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log(req.user.role, "isAuthenticated middleware");

    next();
  } catch (error) {
    return next(new ErrorHandler(error.message, 404));
  }
};

export const hasRole = (...allowedRoles) => {
  return CatchAsyncError(async (req, res, next) => {
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("Unauthorized. Please login.", 401));
    }

    const user = await User.findById(userId).select("role");

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    console.log(user.role, "hasRole middleware");
    if (!allowedRoles.includes(user.role)) {
      return next(
        new ErrorHandler(
          `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
          403,
        ),
      );
    }

    next();
  });
};
