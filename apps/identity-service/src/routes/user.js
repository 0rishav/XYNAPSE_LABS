import express from "express";
import {
  activateUser,
  deleteUser,
  generateResetPasswordToken,
  generateTwoFactorToken,
  getAllUsers,
  getUserDetails,
  googleLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registrationUser,
  resetPassword,
  updatePassword,
  updateSocialMedia,
  updateUserDetails,
  updateUserRole,
  verifyTwoFactorToken,
  verifyTwoFAOtp,
  verifyResetOtp,
  getSolvedProblems,
  getUserProblemStats,
  getSolvedProblemsDetailed,
  requestEmailChange,
  verifyEmailChange,
  requestAccountDeletionOtp,
  confirmAccountDisable,
  getReferralCode,
  getReferralStats,
  logoutAllDevices,
  toggleUserStatus,
  getUsersBatchInternal,
} from "../controllers/user.js";
import { upload } from "../../../../packages/common/src/infra/multerConfig.js";
import { validateRequest } from "../../../../packages/common/src/middleware/validationRequest.js";
import { attachRequestId } from "../../../../packages/common/src/middleware/requestId.js";
import { sanitizeRequest } from "../../../../packages/common/src/middleware/sanitizationInput.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from "../../../../packages/common/src/validation/authSchema.js";
import {
  hasRole,
  isAuthenticated,
} from "../../../../packages/common/src/middleware/auth.js";
import { validateUserStatus } from "../middleware/verifyUser.js";
import { isInternalService } from "../../../../packages/common/src/utils/internalService.js";

const userRouter = express.Router();

userRouter.get("/google", attachRequestId, googleLogin);

userRouter.get(
  "/me",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  getUserDetails,
);

userRouter.get(
  "/all-users",
  attachRequestId,
  isAuthenticated,
  hasRole("super_admin"),
  getAllUsers,
);

userRouter.post(
  "/internal/users-batch",
  attachRequestId,
  isInternalService,
  getUsersBatchInternal,
);

userRouter.get(
  "/referral",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  getReferralCode,
);

userRouter.get(
  "/referral-stats",
  attachRequestId,
  isAuthenticated,
  getReferralStats,
);

userRouter.post(
  "/register",
  attachRequestId,
  upload.single("image"),
  sanitizeRequest,
  validateRequest({
    body: registerSchema,
  }),
  registrationUser,
);

userRouter.post("/activate-user", attachRequestId, activateUser);

userRouter.post(
  "/login",
  attachRequestId,
  sanitizeRequest,
  validateRequest({
    body: loginSchema,
  }),
  loginUser,
);

userRouter.post("/refresh-token", attachRequestId, refreshAccessToken);

userRouter.post(
  "/generate-reset-token",
  attachRequestId,
  sanitizeRequest,
  validateRequest({ body: forgotPasswordSchema }),
  generateResetPasswordToken,
);

userRouter.post("/verify-reset-otp", attachRequestId, verifyResetOtp);

userRouter.post(
  "/new-password",
  attachRequestId,
  sanitizeRequest,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword,
);

userRouter.post(
  "/logout",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  logoutUser,
);

userRouter.post(
  "/logout-all",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  logoutAllDevices,
);

userRouter.patch(
  "/user/edit-profile",
  attachRequestId,
  upload.single("image"),
  isAuthenticated,
  validateUserStatus,
  sanitizeRequest,
  updateUserDetails,
);

userRouter.patch(
  "/user/social-accounts",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  sanitizeRequest,
  updateSocialMedia,
);

userRouter.delete(
  "/delete-user/:id",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  hasRole("super_admin"),
  deleteUser,
);

userRouter.put(
  "/update-role/:id",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  hasRole("super_admin"),
  updateUserRole,
);

userRouter.patch(
  "/user/update-password",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  validateRequest({ body: updatePasswordSchema }),
  updatePassword,
);

// Change Email (Dual OTP)
userRouter.post(
  "/user/change-email/request",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  requestEmailChange,
);
userRouter.post(
  "/user/change-email/verify",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  verifyEmailChange,
);

// Account Disable (Soft Delete)
userRouter.post(
  "/user/delete/request-otp",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  requestAccountDeletionOtp,
);
userRouter.post(
  "/user/delete/confirm",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  confirmAccountDisable,
);

userRouter.patch(
  "/admin/enable-user/:id",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  hasRole("super_admin"),
  toggleUserStatus,
);

userRouter.post(
  "/two-fa-token",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  generateTwoFactorToken,
);

userRouter.post(
  "/verify-two-fa",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  verifyTwoFactorToken,
);

userRouter.post("/verify-2fa", attachRequestId, verifyTwoFAOtp);

userRouter.get(
  "/solved-problems",
  attachRequestId,
  isAuthenticated,
  validateUserStatus,
  getSolvedProblems,
);

// Problem statistics for the authenticated user
userRouter.get(
  "/stats/problems",
  attachRequestId,
  isAuthenticated,
  getUserProblemStats,
);

// Detailed solved problems list for the authenticated user
userRouter.get(
  "/solved-problems/detailed",
  attachRequestId,
  isAuthenticated,
  getSolvedProblemsDetailed,
);

export default userRouter;
