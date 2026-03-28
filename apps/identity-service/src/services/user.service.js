import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import cloudinary from "../../../../packages/common/src/infra/cloudinaryConfig.js";
import { sendMail } from "../../../../packages/common/src/infra/sendMail.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import AuditLog from "../models/auditLogModal.js";
import Referral from "../models/referralModal.js";
import Session from "../models/sessionModal.js";
import User from "../models/userModal.js";
import { createActivationToken } from "../utils/createActivationCode.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import VerificationToken from "../models/verificationTokenModal.js";

export const registerUserService = async (
  payload,
  file,
  referralCode,
  context,
) => {
  const { name, email, password, confirmPassword } = payload;
  const { requestId } = context;

  if (password !== confirmPassword) {
    throw new ErrorHandler(
      "Passwords do not match",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ErrorHandler(
      "Email already registered",
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  let image = "";
  if (file) {
    const uploadRes = await cloudinary.uploader.upload(file.path, {
      folder: "xynapse_users",
    });
    image = uploadRes.secure_url;
  }

  const userPayload = { name, email, password, image, referralCode };
  const activationData = createActivationToken(userPayload);

  logger.info(`[RegistrationInitiated] RID: ${requestId} - Email: ${email}`);

  return {
    activationToken: activationData.token,
    activationCode: activationData.activationCode,
  };
};

export const activateUserService = async (activationCode, token, context) => {
  const { requestId, ip, userAgent } = context;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACTIVATION_SECRET);
  } catch (err) {
    logger.error(`[ActivationJWTError] RID: ${requestId} - ${err.message}`);

    const message =
      err.name === "TokenExpiredError"
        ? "OTP Expired"
        : "Invalid Activation Session";
    throw new ErrorHandler(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.TOKEN_EXPIRED,
    );
  }

  if (String(decoded.activationCode) !== String(activationCode)) {
    throw new ErrorHandler(
      "Invalid Activation Code",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const { name, email, password, image, referralCode } = decoded.user;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ErrorHandler(
      "Email already registered",
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  const newUser = await User.create({
    name,
    email,
    password,
    image,
  });

  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.trim() });
    if (referrer && referrer.email !== email) {
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: newUser._id,
        status: "completed",
        rewardGranted: true,
      });
      logger.info(
        `[ReferralSuccess] RID: ${requestId} - Referrer: ${referrer.email} -> New: ${email}`,
      );
    }
  }

  await AuditLog.create({
    user: newUser._id,
    action: "ACCOUNT_ENABLED",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent,
    metadata: { requestId },
  });

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    image: newUser.image,
    referralCode: newUser.referralCode,
  };
};

export const loginUserService = async (email, password, context) => {
  const {
    requestId,
    ip,
    userAgent,
    deviceId = "unknown_device_" + Date.now(),
    deviceName = "Unknown Device",
  } = context;

  logger.info(`[LOGIN_ATTEMPT] RID: ${requestId} - Email: ${email}`);

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    logger.warn(`[LOGIN_FAILED] RID: ${requestId} - User not found: ${email}`);
    throw new ErrorHandler(
      "Invalid credentials",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  if (user.isDisabled)
    throw new ErrorHandler(
      "Account disabled",
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.USER_DISABLED,
    );
  if (user.isLocked())
    throw new ErrorHandler(
      "Account locked",
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.TOO_MANY_REQUESTS,
    );

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    logger.warn(
      `[LOGIN_FAILED] RID: ${requestId} - Wrong password for: ${email}`,
    );
    throw new ErrorHandler(
      "Invalid credentials",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  await user.resetLoginAttempts();

  if (user.isTwoFactorEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await VerificationToken.deleteMany({
      userId: user._id,
      type: "2fa_challenge",
    });

    await VerificationToken.create({
      userId: user._id,
      type: "2fa_challenge",
      tokenHash: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      ipAddress: ip,
      userAgent,
    });

    const otpToken = jwt.sign({ userId: user._id }, process.env.OTP_SECRET, {
      expiresIn: "5m",
    });

    await sendMail({
      email: user.email,
      subject: "Login Verification Code",
      template: "otp-2fa.ejs",
      data: { user: { name: user.name }, otpToken: otp },
    });

    logger.info(
      `[2FA_REQUIRED] RID: ${requestId} - DB-backed OTP sent to: ${email}`,
    );
    return { requires2FA: true, otpToken };
  }

  await Session.updateMany(
    { user: user._id, deviceId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Session.create({
    user: user._id,
    refreshTokenHash,
    deviceId,
    deviceName,
    ipAddress: ip,
    userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const accessToken = user.generateAccessToken();

  await AuditLog.create({
    user: user._id,
    action: "LOGIN_SUCCESS",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent,
    metadata: { requestId, sessionId: session._id },
  });

  logger.info(
    `[LOGIN_SUCCESS] RID: ${requestId} - User: ${email} logged in directly`,
  );

  return {
    requires2FA: false,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    },
    accessToken,
    refreshToken,
  };
};

export const verifyTwoFAService = async (otpToken, otpCode, context) => {
  const { requestId, ip, userAgent, deviceId, deviceName } = context;

  let decoded;
  try {
    decoded = jwt.verify(otpToken, process.env.OTP_SECRET);
  } catch (err) {
    logger.error(`[2FA_JWT_ERROR] RID: ${requestId} - ${err.message}`);
    throw new ErrorHandler(
      "Invalid or expired session",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");
  const tokenDoc = await VerificationToken.findOne({
    userId: decoded.userId,
    tokenHash: hashedOtp,
    type: "2fa_challenge",
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  });

  if (!tokenDoc) {
    logger.warn(
      `[2FA_VERIFY_FAILED] RID: ${requestId} - Invalid OTP for User: ${decoded.userId}`,
    );
    throw new ErrorHandler(
      "Invalid or expired OTP code",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  await tokenDoc.markAsUsed();

  const user = await User.findById(decoded.userId);
  if (!user) throw new ErrorHandler("User not found", HTTP_STATUS.NOT_FOUND);

  await Session.updateMany(
    { user: user._id, deviceId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Session.create({
    user: user._id,
    refreshTokenHash,
    deviceId,
    deviceName,
    ipAddress: ip,
    userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const accessToken = user.generateAccessToken();

  await AuditLog.create({
    user: user._id,
    action: "TWO_FA_LOGIN_SUCCESS",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent,
    metadata: { requestId, sessionId: session._id },
  });

  logger.info(
    `[2FA_VERIFY_SUCCESS] RID: ${requestId} - User: ${user.email} session: ${session._id}`,
  );

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessTokenService = async (
  incomingRefreshToken,
  context,
) => {
  const { requestId, ip, userAgent } = context;

  const incomingHash = crypto
    .createHash("sha256")
    .update(incomingRefreshToken)
    .digest("hex");

  const session = await Session.findOne({
    refreshTokenHash: incomingHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash");

  if (!session) {
    throw new ErrorHandler(
      "Invalid or expired refresh token",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
    );
  }

  const user = await User.findById(session.user);
  if (!user || user.isDisabled) {
    throw new ErrorHandler(
      "User no longer active",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.USER_DISABLED,
    );
  }

  await session.revoke();

  const newRefreshToken = crypto.randomBytes(40).toString("hex");
  const newHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  const newSession = await Session.create({
    user: user._id,
    refreshTokenHash: newHash,
    deviceId: session.deviceId,
    deviceName: session.deviceName,
    ipAddress: ip,
    userAgent: userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const accessToken = user.generateAccessToken();

  logger.info(
    `[TokenRotated] RID: ${requestId} - User: ${user.email} - NewSession: ${newSession._id}`,
  );

  return { user, accessToken, newRefreshToken };
};

export const logoutUserService = async (refreshToken, context) => {
  const { requestId } = context;

  if (!refreshToken) return;

  const incomingHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const session = await Session.findOne({
    refreshTokenHash: incomingHash,
    isRevoked: false,
  });

  if (session) {
    await session.revoke();
    logger.info(
      `[LogoutService] RID: ${requestId} - Session ${session._id} revoked successfully.`,
    );
  } else {
    logger.warn(
      `[LogoutService] RID: ${requestId} - No active session found for the provided token.`,
    );
  }

  return true;
};

export const logoutFromAllDevicesService = async (userId, context) => {
  const { requestId, ip, userAgent } = context;

  const result = await Session.updateMany(
    { user: userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    },
  );

  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true },
  );

  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  await AuditLog.create({
    user: userId,
    action: "LOGOUT_ALL",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      revokedSessionsCount: result.modifiedCount,
    },
  });

  logger.info(
    `[LogoutAllDevices] RID: ${requestId} - User: ${user.email} - Revoked ${result.modifiedCount} sessions.`,
  );

  return true;
};

export const getUserDetailsService = async (userId, context) => {
  const { requestId } = context;

  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    city: user.city,
    phone: user.phone,
    country: user.country,
    gender: user.gender,
    socialMedia: user.socialMedia || {
      linkedin: "",
      github: "",
      twitter: "",
    },
    role: user.role,
    image: user.image,
    referralCode: user.referralCode,
    preferences: user.preferences,
    codingStats: user.codingStats,
    createdAt: user.createdAt,
  };

  logger.info(`[UserDetailsFetched] RID: ${requestId} - UserID: ${userId}`);

  return sanitizedUser;
};

export const getAllUsersService = async (pagination, context) => {
  const { page, limit, skip } = pagination;
  const { requestId } = context;

  const totalUsers = await User.countDocuments();

  const users = await User.find()
    .select("name email image role isDisabled referralCode")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  if (!users || users.length === 0) {
    throw new ErrorHandler(
      "No users found!",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  logger.info(
    `[AdminGetAllUsers] RID: ${requestId} - Page: ${page} - Total: ${totalUsers}`,
  );

  return {
    users,
    pagination: {
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      hasNextPage: page * limit < totalUsers,
    },
  };
};

export const toggleUserStatusService = async (userId, context) => {
  const { requestId, ip, userAgent, adminId } = context;

  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const oldStatus = user.isDisabled ? "DISABLED" : "ENABLED";
  user.isDisabled = !user.isDisabled;

  if (!user.isDisabled) {
    user.accountDeletion = undefined;
  }

  await user.save();

  const newStatus = user.isDisabled ? "DISABLED" : "ENABLED";
  const actionType = user.isDisabled ? "ACCOUNT_DISABLED" : "ACCOUNT_ENABLED";

  await AuditLog.create({
    user: user._id,
    performedBy: adminId || null,
    action: actionType,
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      previousStatus: oldStatus,
      currentStatus: newStatus,
    },
  });

  logger.info(
    `[UserStatusToggled] RID: ${requestId} - User: ${userId} - NewStatus: ${newStatus} - PerformedBy: ${adminId}`,
  );

  return {
    _id: user._id,
    isDisabled: user.isDisabled,
    status: newStatus.toLowerCase(),
  };
};

export const updateUserRoleService = async (userId, newRole, context) => {
  const { requestId, ip, userAgent, adminId } = context;

  const allowedRoles = ["user", "admin", "moderator"];
  const formattedRole = newRole?.toLowerCase().trim();

  if (!allowedRoles.includes(formattedRole)) {
    throw new ErrorHandler(
      `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  if (user.role === formattedRole) {
    throw new ErrorHandler(
      `User is already an ${formattedRole}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const oldRole = user.role;
  user.role = formattedRole;
  await user.save();

  await AuditLog.create({
    user: user._id,
    performedBy: adminId || null,
    action: "ROLE_CHANGED",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      oldRole,
      newRole: formattedRole,
    },
  });

  logger.info(
    `[RoleUpdated] RID: ${requestId} - User: ${userId} - NewRole: ${formattedRole} - PerformedBy: ${adminId}`,
  );

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export const updateUserDetailsService = async (
  userId,
  updateBody,
  file,
  context,
) => {
  const { requestId, ip, userAgent } = context;

  const allowedFields = ["name", "phone", "gender", "country", "city"];
  const updateData = {};

  Object.keys(updateBody).forEach((key) => {
    if (allowedFields.includes(key)) {
      updateData[key] = updateBody[key];
    }
  });

  if (file) {
    try {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: "xynapse_users",
      });
      updateData.image = uploadRes.secure_url;
    } catch (error) {
      logger.error(`[ImageUploadError] RID: ${requestId} - ${error.message}`);
      throw new ErrorHandler(
        "Image upload failed!",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  ).lean();

  if (!updatedUser) {
    throw new ErrorHandler(
      "User not found!",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  await AuditLog.create({
    user: userId,
    action: "PROFILE_UPDATE",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      updatedFields: Object.keys(updateData),
    },
  });

  logger.info(`[UserUpdated] RID: ${requestId} - UserID: ${userId}`);

  const { password, role, refreshToken, passwordHistory, ...sanitizedUser } =
    updatedUser;
  return sanitizedUser;
};

export const updateSocialMediaService = async (
  userId,
  socialLinks,
  context,
) => {
  const { requestId, ip, userAgent } = context;
  const { linkedin, github, twitter } = socialLinks;

  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorHandler(
      "User not found!",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const oldSocialMedia = { ...user.socialMedia };

  user.socialMedia = {
    ...user.socialMedia,
    ...(linkedin && { linkedin: linkedin.trim() }),
    ...(github && { github: github.trim() }),
    ...(twitter && { twitter: twitter.trim() }),
  };

  await user.save();

  await AuditLog.create({
    user: userId,
    action: "SOCIAL_LINKS_UPDATE",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      updatedPlatforms: Object.keys(socialLinks).filter(
        (key) => socialLinks[key],
      ),
    },
  });

  logger.info(`[SocialUpdate] RID: ${requestId} - User: ${userId}`);

  return {
    _id: user._id,
    socialMedia: user.socialMedia,
  };
};

export const generateResetTokenService = async (email, context) => {
  const { requestId, ip, userAgent } = context;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  await VerificationToken.updateMany(
    { userId: user._id, type: "reset_password", isUsed: false },
    { $set: { isUsed: true } },
  );

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const newToken = await VerificationToken.create({
    userId: user._id,
    type: "reset_password",
    tokenHash: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    ipAddress: ip,
    userAgent,
  });

  await AuditLog.create({
    user: user._id,
    action: "PASSWORD_RESET_REQUESTED",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent,
    metadata: { requestId },
  });

  await sendMail({
    email: user.email,
    subject: "Your Password Reset OTP",
    template: "reset-otp.ejs",
    data: { user: { name: user.name }, otp },
  });

  logger.info(
    `[ResetTokenGenerated] RID: ${requestId} - User: ${email}, TokenID: ${newToken._id}`,
  );

  return {
    email: user.email,
    tokenId: newToken._id,
  };
};

export const verifyResetOtpService = async (tokenId, otp, context) => {
  const { requestId, ip, userAgent } = context;

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const otpDoc = await VerificationToken.findOne({
    _id: tokenId,
    tokenHash: hashedOtp,
    type: "reset_password",
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  });

  if (!otpDoc) {
    logger.warn(`[OTP_VERIFY_FAILED] RID: ${requestId} - Invalid/Expired OTP`);
    throw new ErrorHandler("Invalid or expired OTP", 400);
  }

  otpDoc.isUsed = true;
  otpDoc.usedAt = new Date();
  await otpDoc.save();

  const rawResetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(rawResetToken)
    .digest("hex");

  await VerificationToken.create({
    userId: otpDoc.userId,
    type: "reset_password",
    tokenHash: hashedResetToken,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ipAddress: ip,
    userAgent: userAgent,
  });

  logger.info(
    `[OTP_VERIFIED] RID: ${requestId} - New Reset Grant Token issued`,
  );

  return rawResetToken;
};

export const resetPasswordService = async (
  token,
  newPassword,
  confirmNewPassword,
  context,
) => {
  const { requestId, ip, userAgent } = context;

  if (newPassword !== confirmNewPassword) {
    throw new ErrorHandler("Passwords do not match", HTTP_STATUS.BAD_REQUEST);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tokenDoc = await VerificationToken.findOne({
    tokenHash,
    type: "reset_password",
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  }).populate("userId");

  if (!tokenDoc || !tokenDoc.userId) {
    logger.warn(
      `[PASSWORD_RESET_FAILED] RID: ${requestId} - Invalid Grant Token`,
    );
    throw new ErrorHandler(
      "Invalid or expired session token",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const user = tokenDoc.userId;

  user.password = newPassword;

  await tokenDoc.markAsUsed();

  await user.save();

  await AuditLog.create({
    user: user._id,
    action: "PASSWORD_RESET_SUCCESS",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent,
    metadata: { requestId },
  });

  logger.info(`[PasswordResetSuccess] RID: ${requestId} - User: ${user.email}`);
  return true;
};

export const deleteUserService = async (targetUserId, context) => {
  const { requestId, ip, userAgent, adminId } = context;

  const user = await User.findById(targetUserId);

  if (!user) {
    throw new ErrorHandler(
      "User not found!",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const userEmail = user.email;

  await Session.deleteMany({ user: targetUserId });

  await user.deleteOne();

  await AuditLog.create({
    user: targetUserId,
    performedBy: adminId,
    action: "USER_DELETED_PERMANENTLY",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: {
      requestId,
      deletedUserEmail: userEmail,
      reason: "Administrative Action",
    },
  });

  logger.info(
    `[UserDeleted] RID: ${requestId} - Admin: ${adminId} deleted UserID: ${targetUserId}`,
  );

  return { email: userEmail };
};

export const updatePasswordService = async (userId, passwords, context) => {
  const { currentPassword, newPassword } = passwords;
  const { requestId, ip, userAgent } = context;

  const user = await User.findById(userId).select("+password +passwordHistory");
  if (!user) {
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const isMatch = await user.isPasswordCorrect(currentPassword);
  if (!isMatch) {
    throw new ErrorHandler(
      "Invalid current password",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }

  user.password = newPassword;
  await user.save();

  await AuditLog.create({
    user: user._id,
    action: "PASSWORD_UPDATED_LOGGED_IN",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: { requestId },
  });

  logger.info(`[PasswordUpdated] RID: ${requestId} - User: ${user._id}`);
  return true;
};

export const generate2FATokenService = async (userId, context) => {
  const { requestId, ip, userAgent } = context;

  logger.info(
    `[2FA_START] RID: ${requestId} - Requesting 2FA for User: ${userId}`,
  );

  const user = await User.findById(userId);
  if (!user) {
    logger.error(`[2FA_ERROR] RID: ${requestId} - User not found: ${userId}`);
    throw new ErrorHandler(
      "User not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND,
    );
  }

  const deleteResult = await VerificationToken.deleteMany({
    userId: user._id,
    type: "2fa_challenge",
  });
  logger.info(
    `[2FA_CLEANUP] RID: ${requestId} - Deleted ${deleteResult.deletedCount} old tokens`,
  );

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  await VerificationToken.create({
    userId: user._id,
    type: "2fa_challenge",
    tokenHash: hashedOtp,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ipAddress: ip,
    userAgent: userAgent,
  });
  logger.info(
    `[2FA_TOKEN_CREATED] RID: ${requestId} - Token stored for ${user.email}`,
  );

  try {
    await sendMail({
      email: user.email,
      subject: "Enable Two-Factor Authentication",
      template: "enable-2fa.ejs",
      data: {
        user: { name: user.name },
        activationCode: otp,
      },
    });
    logger.info(
      `[2FA_MAIL_SENT] RID: ${requestId} - OTP sent to ${user.email}`,
    );
  } catch (mailError) {
    logger.error(
      `[2FA_MAIL_FAILED] RID: ${requestId} - Mail error: ${mailError.message}`,
    );
    throw new ErrorHandler("Failed to send OTP", 500);
  }

  return user.email;
};

export const verify2FATokenService = async (userId, otp, context) => {
  const { requestId, ip, userAgent } = context;

  logger.info(
    `[2FA_VERIFY_START] RID: ${requestId} - Verifying OTP for User: ${userId}`,
  );

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const tokenDoc = await VerificationToken.findOne({
    userId,
    tokenHash: hashedOtp,
    type: "2fa_challenge",
    isUsed: false,
    expiresAt: { $gt: Date.now() },
  });

  if (!tokenDoc) {
    logger.warn(
      `[2FA_VERIFY_FAILED] RID: ${requestId} - Invalid or Expired OTP attempt for User: ${userId} | IP: ${ip}`,
    );
    throw new ErrorHandler(
      "Invalid or expired OTP",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_TOKEN,
    );
  }

  logger.info(
    `[2FA_VERIFY_SUCCESS] RID: ${requestId} - Valid OTP found. Updating user status...`,
  );

  const user = await User.findById(userId);
  if (!user) {
    logger.error(
      `[2FA_VERIFY_ERROR] RID: ${requestId} - User not found during verification: ${userId}`,
    );
    throw new ErrorHandler("User not found", 404);
  }

  user.isTwoFactorEnabled = true;
  tokenDoc.isUsed = true;

  try {
    await Promise.all([user.save(), tokenDoc.save()]);
    logger.info(
      `[2FA_STATUS_UPDATED] RID: ${requestId} - 2FA enabled for ${user.email}`,
    );

    await AuditLog.create({
      user: user._id,
      action: "2FA_ENABLED_SUCCESSFULLY",
      status: "SUCCESS",
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { requestId },
    });
    logger.info(`[2FA_AUDIT_LOGGED] RID: ${requestId} - Audit record created`);
  } catch (error) {
    logger.error(
      `[2FA_SAVE_ERROR] RID: ${requestId} - Failed to persist 2FA status: ${error.message}`,
    );
    throw error;
  }

  return true;
};

export const requestEmailChangeService = async (userId, newEmail, context) => {
  const { requestId } = context;

  logger.info(
    `[EMAIL_CHANGE_REQ_START] RID: ${requestId} - User: ${userId} requesting change to: ${newEmail}`,
  );

  const user = await User.findById(userId);
  if (!user) {
    logger.error(
      `[EMAIL_CHANGE_REQ_ERROR] RID: ${requestId} - User not found: ${userId}`,
    );
    throw new ErrorHandler("User not found!", HTTP_STATUS.NOT_FOUND);
  }

  const exists = await User.findOne({ email: newEmail });
  if (exists) {
    logger.warn(
      `[EMAIL_CHANGE_REQ_CONFLICT] RID: ${requestId} - Email ${newEmail} already taken`,
    );
    throw new ErrorHandler("Email already in use", HTTP_STATUS.BAD_REQUEST);
  }

  const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
  const rawCurrentOtp = genOtp();
  const rawNewOtp = genOtp();

  const currentEmailOtp = crypto
    .createHash("sha256")
    .update(rawCurrentOtp)
    .digest("hex");
  const newEmailOtp = crypto
    .createHash("sha256")
    .update(rawNewOtp)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.emailChange = { newEmail, currentEmailOtp, newEmailOtp, expiresAt };
  await user.save();
  logger.info(
    `[EMAIL_CHANGE_REQ_SAVED] RID: ${requestId} - OTP hashes stored in DB`,
  );

  try {
    await Promise.all([
      sendMail({
        email: user.email,
        subject: "Confirm Email Change - Current Email OTP",
        template: "otp-2fa.ejs",
        data: { user: { name: user.name }, otpToken: rawCurrentOtp },
      }),
      sendMail({
        email: newEmail,
        subject: "Confirm Email Change - New Email OTP",
        template: "otp-2fa.ejs",
        data: { user: { name: user.name }, otpToken: rawNewOtp },
      }),
    ]);
    logger.info(
      `[EMAIL_CHANGE_MAIL_SENT] RID: ${requestId} - OTPs sent to both ${user.email} and ${newEmail}`,
    );
  } catch (error) {
    logger.error(
      `[EMAIL_CHANGE_MAIL_ERROR] RID: ${requestId} - Mailer failed: ${error.message}`,
    );
    throw new ErrorHandler("Failed to send OTP emails", 500);
  }

  return true;
};

export const verifyEmailChangeService = async (userId, data, context) => {
  const { newEmail, currentOtp, newOtp } = data;
  const { requestId, ip, userAgent } = context;

  logger.info(
    `[EMAIL_CHANGE_VERIFY_START] RID: ${requestId} - Verifying change for User: ${userId} to ${newEmail}`,
  );

  const user = await User.findById(userId);
  const pending = user.emailChange || {};

  if (!pending.newEmail || pending.newEmail !== newEmail) {
    logger.warn(
      `[EMAIL_CHANGE_VERIFY_MISMATCH] RID: ${requestId} - No pending request or email mismatch`,
    );
    throw new ErrorHandler(
      "No pending email change for this email",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!pending.expiresAt || pending.expiresAt < Date.now()) {
    logger.warn(
      `[EMAIL_CHANGE_VERIFY_EXPIRED] RID: ${requestId} - OTP expired for User: ${userId}`,
    );
    user.emailChange = undefined;
    await user.save();
    throw new ErrorHandler(
      "OTP expired. Please request again.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const hashedCurrent = crypto
    .createHash("sha256")
    .update(currentOtp)
    .digest("hex");
  const hashedNew = crypto.createHash("sha256").update(newOtp).digest("hex");

  if (
    pending.currentEmailOtp !== hashedCurrent ||
    pending.newEmailOtp !== hashedNew
  ) {
    logger.error(
      `[EMAIL_CHANGE_VERIFY_INVALID_OTP] RID: ${requestId} - Incorrect OTPs provided by User: ${userId}`,
    );
    throw new ErrorHandler("Invalid OTP(s)", HTTP_STATUS.BAD_REQUEST);
  }

  const oldEmail = user.email;
  user.email = newEmail;
  user.emailChange = undefined;
  await user.save();

  logger.info(
    `[EMAIL_CHANGE_SUCCESS] RID: ${requestId} - User ${userId} changed email from ${oldEmail} to ${newEmail}`,
  );

  await AuditLog.create({
    user: user._id,
    action: "EMAIL_CHANGED",
    status: "SUCCESS",
    ipAddress: ip,
    userAgent: userAgent,
    metadata: { requestId, oldEmail, newEmail },
  });
  logger.info(`[EMAIL_CHANGE_AUDIT_LOGGED] RID: ${requestId}`);

  return user;
};

export const requestDeletionOtpService = async (userId, context) => {
  const { requestId } = context;

  logger.info(
    `[DELETION_REQ_START] RID: ${requestId} - User ${userId} requested deletion OTP`,
  );

  const user = await User.findById(userId);
  if (!user) {
    logger.error(
      `[DELETION_REQ_ERROR] RID: ${requestId} - User not found: ${userId}`,
    );
    throw new ErrorHandler("User not found!", HTTP_STATUS.NOT_FOUND);
  }

  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.accountDeletion = { otp: hashedOtp, expiresAt };

  try {
    await user.save();
    logger.info(
      `[DELETION_REQ_SAVED] RID: ${requestId} - Hashed OTP stored for ${user.email}`,
    );

    await sendMail({
      email: user.email,
      subject: "Confirm Account Deletion - OTP",
      template: "otp-2fa.ejs",
      data: { user: { name: user.name }, otpToken: rawOtp },
    });

    logger.info(
      `[DELETION_MAIL_SENT] RID: ${requestId} - Deletion OTP email dispatched to ${user.email}`,
    );
  } catch (error) {
    logger.error(
      `[DELETION_PROCESS_FAILED] RID: ${requestId} - Error: ${error.message}`,
    );
    throw new ErrorHandler("Failed to process deletion request", 500);
  }

  return user.email;
};

export const confirmAccountDisableService = async (userId, data, context) => {
  const { password, otp } = data;
  const { requestId, ip, userAgent } = context;

  logger.info(
    `[ACCOUNT_DISABLE_START] RID: ${requestId} - User ${userId} attempting to disable account`,
  );

  const user = await User.findById(userId).select("+password");
  if (!user) {
    logger.error(
      `[ACCOUNT_DISABLE_ERROR] RID: ${requestId} - User not found: ${userId}`,
    );
    throw new ErrorHandler("User not found!", HTTP_STATUS.NOT_FOUND);
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    logger.warn(
      `[ACCOUNT_DISABLE_AUTH_FAIL] RID: ${requestId} - Incorrect password attempt for User: ${userId}`,
    );
    throw new ErrorHandler("Invalid password", HTTP_STATUS.BAD_REQUEST);
  }

  const pending = user.accountDeletion || {};
  if (!pending.otp || !pending.expiresAt || pending.expiresAt < Date.now()) {
    logger.warn(
      `[ACCOUNT_DISABLE_OTP_EXPIRED] RID: ${requestId} - No valid/active OTP found for User: ${userId}`,
    );
    throw new ErrorHandler(
      "OTP expired or not found. Request again.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (pending.otp !== hashedInputOtp) {
    logger.warn(
      `[ACCOUNT_DISABLE_OTP_INVALID] RID: ${requestId} - Invalid OTP provided for User: ${userId}`,
    );
    throw new ErrorHandler("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
  }

  user.isDisabled = true;
  user.accountDeletion = undefined;

  try {
    await user.save();
    logger.info(
      `[ACCOUNT_DISABLED_SUCCESS] RID: ${requestId} - User: ${userId} is now disabled`,
    );

    await AuditLog.create({
      user: user._id,
      action: "ACCOUNT_SELF_DISABLED",
      status: "SUCCESS",
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { requestId },
    });
    logger.info(`[ACCOUNT_DISABLE_AUDIT_LOGGED] RID: ${requestId}`);
  } catch (error) {
    logger.error(
      `[ACCOUNT_DISABLE_SAVE_ERROR] RID: ${requestId} - Database error during disabling: ${error.message}`,
    );
    throw error;
  }

  return true;
};
