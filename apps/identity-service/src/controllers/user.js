import User from "../models/userModal.js";
import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
// import ejs from "ejs";
// import bcrypt from "bcrypt";
import ErrorHandler from "../../../../packages/common/src/errors/ErrorHandler.js";
import { oauth2Client } from "../../../../packages/common/src/infra/googleConfig.js";
import { CatchAsyncError } from "../../../../packages/common/src/middleware/CatchAsyncError.js";
import Submission from "../../../submission-service/src/models/submissionModal.js";
import Problem from "../../../problem-service/src/models/problemModal.js";
import { sendMail } from "../../../../packages/common/src/infra/sendMail.js";
import { sendResponse } from "../../../../packages/common/src/utils/sendResponse.js";
import {
  activateUserService,
  confirmAccountDisableService,
  deleteUserService,
  generate2FATokenService,
  generateResetTokenService,
  getAllUsersService,
  getUserDetailsService,
  loginUserService,
  logoutFromAllDevicesService,
  logoutUserService,
  refreshAccessTokenService,
  registerUserService,
  requestDeletionOtpService,
  requestEmailChangeService,
  resetPasswordService,
  toggleUserStatusService,
  updatePasswordService,
  updateSocialMediaService,
  updateUserDetailsService,
  updateUserRoleService,
  verify2FATokenService,
  verifyEmailChangeService,
  verifyResetOtpService,
  verifyTwoFAService,
} from "../services/user.service.js";
import { HTTP_STATUS } from "../../../../packages/common/src/constants/httpStatus.js";
import { getPagination } from "../../../../packages/common/src/utils/paginationHelper.js";
import logger from "../../../../packages/common/src/utils/logger.js";
import { ERROR_CODES } from "../../../../packages/common/src/constants/errorCode.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessAndRefreshToken:", error.message);
    throw new Error("Failed to generate tokens");
  }
};

const FRONTEND_URL = process.env.FRONTEND_URL;

export const googleLogin = CatchAsyncError(async (req, res, next) => {
  let { code, state } = req.query;
  let referralCode = null;
  if (state) {
    try {
      const decodedState = decodeURIComponent(state);
      const match = decodedState.match(/ref=([A-Z0-9]+)/i);
      if (match) referralCode = match[1];
    } catch (err) {
      console.warn("Failed to parse referral code:", err.message);
    }
  }

  if (!code) {
    let stateParam = null;
    if (referralCode) {
      stateParam = encodeURIComponent(`ref=${referralCode}`);
    } else if (req.query.ref) {
      stateParam = encodeURIComponent(`ref=${req.query.ref}`);
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["profile", "email"],
      prompt: "consent",
      redirect_uri: "https://upcoding.codexuslabs.com/api/v1/auth/google",
      state: stateParam || undefined,
    });
    return res.redirect(authUrl);
  }

  let googleRes;
  try {
    googleRes = await oauth2Client.getToken(code);
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch Google token", 400));
  }

  const { tokens } = googleRes;
  if (!tokens?.access_token) {
    return next(new ErrorHandler("Invalid Google token response", 400));
  }

  oauth2Client.setCredentials(tokens);

  let userRes;
  try {
    userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${tokens.access_token}`,
    );
  } catch (error) {
    return next(new ErrorHandler("Failed to fetch Google user info", 400));
  }

  const { name, email, picture } = userRes.data || {};
  if (!email) {
    return next(new ErrorHandler("Google account email not found", 400));
  }

  let user = await User.findOne({ email });

  if (!user) {
    let referredBy = null;

    if (referralCode) {
      const referrer = await User.findOne({
        referralCode: referralCode.trim(),
      });

      if (referrer && referrer.email.toLowerCase() !== email.toLowerCase()) {
        referredBy = referrer._id;

        referrer.referralCount += 1;
        referrer.referralRewards += 10;
        await referrer.save();
      } else {
        console.log("Referrer not found OR self-referral attempted");
      }
    } else {
      console.log("No referral code provided");
    }

    user = await User.create({
      name,
      email,
      image: picture,
      googleAuth: true,
      referredBy,
    });

    if (referredBy) {
      await User.findByIdAndUpdate(referredBy, {
        $push: { referrals: user._id },
      });
    }
  } else {
    user.name = name || user.name;
    user.image = picture || user.image;
    await user.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 24 * 60 * 60 * 1000,
  });
  return res.redirect(FRONTEND_URL);
});

export const registrationUser = CatchAsyncError(async (req, res, next) => {
  const referralCode = req.query.ref || null;
  const { email, name } = req.body;

  const context = {
    requestId: req.requestId,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  const { activationToken, activationCode } = await registerUserService(
    req.body,
    req.file,
    referralCode,
    context,
  );

  await sendMail({
    email: email,
    subject: "Activate Your Account",
    template: "activation-mail.ejs",
    data: {
      user: { name: name },
      activationCode: activationCode,
    },
  });

  res.cookie("activationToken", activationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  sendResponse(
    res,
    HTTP_STATUS.CREATED,
    `Registration successful! Please check ${email} to activate your account.`,
  );
});

export const activateUser = CatchAsyncError(async (req, res, next) => {
  const { activation_code } = req.body;
  const token = req.cookies.activationToken;

  if (!token) {
    throw new ErrorHandler(
      "Activation session expired or not found. Please register again.",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.TOKEN_EXPIRED,
    );
  }

  const context = {
    requestId: req.requestId,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  const user = await activateUserService(activation_code, token, context);

  res.clearCookie("activationToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  sendResponse(
    res,
    HTTP_STATUS.CREATED,
    "User Registered and Activated Successfully",
    { user },
  );
});

export const loginUser = CatchAsyncError(async (req, res, next) => {
  const { email, password, deviceId, deviceName } = req.body;
  const context = {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    deviceId,
    deviceName,
  };

  const result = await loginUserService(email, password, context);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  if (result.requires2FA) {
    res.cookie("otpToken", result.otpToken, {
      ...cookieOptions,
      maxAge: 5 * 60 * 1000,
    });
    return sendResponse(res, HTTP_STATUS.OK, "OTP sent to email", {
      requires2FA: true,
    });
  }

  res.cookie("accessToken", result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, HTTP_STATUS.OK, "Login successful", { user: result.user });
});

export const verifyTwoFAOtp = CatchAsyncError(async (req, res, next) => {
  const { otp_code, deviceId, deviceName } = req.body;
  const { otpToken } = req.cookies;

  const context = {
    requestId: req.requestId,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    deviceId: deviceId || "unknown_device",
    deviceName: deviceName || "Unknown Browser",
  };

  if (!otpToken) {
    return next(
      new ErrorHandler("Session expired, login again", HTTP_STATUS.BAD_REQUEST),
    );
  }

  const result = await verifyTwoFAService(otpToken, otp_code, context);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.clearCookie("otpToken");
  res.cookie("accessToken", result.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", result.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, HTTP_STATUS.OK, "2FA Verified successfully. Logged in!", {
    user: result.user,
  });
});

export const refreshAccessToken = CatchAsyncError(async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ErrorHandler(
      "Refresh token missing",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const context = {
    requestId: req.requestId,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
  };

  const { user, accessToken, newRefreshToken } =
    await refreshAccessTokenService(incomingRefreshToken, context);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // path: "/api/v1/auth/refresh-token",
  });

  sendResponse(res, HTTP_STATUS.OK, "Token refreshed successfully");
});

export const logoutUser = CatchAsyncError(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  const context = {
    requestId: req.requestId,
  };

  await logoutUserService(refreshToken, context);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.clearCookie("accessToken", cookieOptions);

  res.clearCookie("refreshToken", {
    ...cookieOptions,
    // path: "/api/v1/auth/refresh-token",
  });

  sendResponse(res, HTTP_STATUS.OK, "Logged out successfully!");
});

export const logoutAllDevices = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ErrorHandler(
      "User identification failed",
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_REQUIRED,
    );
  }

  const context = {
    requestId: req.requestId,
  };

  await logoutFromAllDevicesService(userId, context);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", {
    ...cookieOptions,
    // path: "/api/v1/auth/refresh-token",
  });

  sendResponse(
    res,
    HTTP_STATUS.OK,
    "Successfully logged out from all devices and sessions invalidated.",
  );
});

export const getUserDetails = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;

  const context = {
    requestId: req.requestId,
  };

  const user = await getUserDetailsService(userId, context);

  sendResponse(res, HTTP_STATUS.OK, "User details fetched successfully", {
    user,
  });
});

export const getAllUsers = CatchAsyncError(async (req, res, next) => {
  const pagination = getPagination(req.query);

  const context = {
    requestId: req.requestId,
  };

  const { users, pagination: meta } = await getAllUsersService(
    pagination,
    context,
  );

  sendResponse(
    res,
    HTTP_STATUS.OK,
    "All users fetched successfully with referral data",
    {
      users,
      pagination: meta,
    },
  );
});

export const deleteUser = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    adminId: req.user._id,
  };

  const result = await deleteUserService(id, context);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `User with email ${result.email} has been deleted successfully.`,
  );
});

export const toggleUserStatus = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    throw new ErrorHandler(
      "User ID is required!",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const context = { requestId: req.requestId, adminId: req.user._id };

  const result = await toggleUserStatusService(id, context);

  sendResponse(
    res,
    HTTP_STATUS.OK,
    `User has been ${result.status} successfully.`,
    { user: result },
  );
});

export const updateUserRole = CatchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { newRole } = req.body;

  if (!id) {
    throw new ErrorHandler("User ID is required!", HTTP_STATUS.BAD_REQUEST);
  }

  const context = { requestId: req.requestId, adminId: req.user._id };

  const user = await updateUserRoleService(id, newRole, context);

  sendResponse(
    res,
    HTTP_STATUS.OK,
    `User role updated to '${user.role}' successfully!`,
    { user },
  );
});

export const generateResetPasswordToken = CatchAsyncError(
  async (req, res, next) => {
    const { email } = req.body;
    const context = {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const { email: sentToEmail, tokenId } = await generateResetTokenService(
      email,
      context,
    );

    res.cookie("resetTokenId", tokenId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000,
    });

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      `An OTP has been sent to ${sentToEmail}`,
    );
  },
);

export const verifyResetOtp = CatchAsyncError(async (req, res, next) => {
  const { otp_code } = req.body;
  const { resetTokenId } = req.cookies; 

  if (!resetTokenId) {
    logger.error(`[OTP_VERIFY_ERROR] RID: ${req.requestId} - resetTokenId cookie missing`);
    throw new ErrorHandler("Session expired or invalid, request OTP again", 400);
  }

  const context = { requestId: req.requestId };
  const sessionToken = await verifyResetOtpService(
    resetTokenId, 
    otp_code,
    context,
  );

  res.clearCookie("resetTokenId");
  
  sendResponse(res, HTTP_STATUS.OK, "OTP verified. Proceed to set new password.", { 
    token: sessionToken 
  });
});

export const resetPassword = CatchAsyncError(async (req, res, next) => {
  const { token, newPassword, confirmNewPassword } = req.body;
  const context = {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await resetPasswordService(token, newPassword, confirmNewPassword, context);
  sendResponse(res, HTTP_STATUS.OK, "Password reset successfully.");
});

export const generateTwoFactorToken = CatchAsyncError(async (req, res) => {
  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const email = await generate2FATokenService(req.user._id, context);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    `Check your email: ${email} for the 6-digit OTP.`,
  );
});

export const verifyTwoFactorToken = CatchAsyncError(async (req, res) => {
  const { otp } = req.body;
  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await verify2FATokenService(req.user._id, otp, context);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Two-factor authentication has been enabled!",
  );
});

export const updateUserDetails = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const file = req.file;

  const context = { requestId: req.requestId };

  const updatedUser = await updateUserDetailsService(
    userId,
    req.body,
    file,
    context,
  );

  sendResponse(res, HTTP_STATUS.OK, "User details updated successfully!", {
    user: updatedUser,
  });
});

export const updateSocialMedia = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;
  const { linkedin, github, twitter } = req.body;

  if (!linkedin && !github && !twitter) {
    throw new ErrorHandler(
      "At least one social media link is required.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const urlRegex =
    /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+)([-._]?[a-zA-Z0-9]*)*\.[a-zA-Z]{2,}(\/.*)?$/;
  const errors = {};

  if (linkedin && !urlRegex.test(linkedin))
    errors.linkedin = "Invalid LinkedIn URL";
  if (github && !urlRegex.test(github)) errors.github = "Invalid GitHub URL";
  if (twitter && !urlRegex.test(twitter))
    errors.twitter = "Invalid Twitter URL";

  if (Object.keys(errors).length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, errors });
  }

  const context = { requestId: req.requestId };

  const updatedData = await updateSocialMediaService(
    userId,
    { linkedin, github, twitter },
    context,
  );

  sendResponse(
    res,
    HTTP_STATUS.OK,
    "Social media links updated successfully!",
    updatedData,
  );
});

export const updatePassword = CatchAsyncError(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user._id;

  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await updatePasswordService(
    userId,
    { currentPassword, newPassword, confirmNewPassword },
    context,
  );

  return sendResponse(res, HTTP_STATUS.OK, "Password updated successfully!");
});

export const getSolvedProblems = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("solvedProblems");

    if (!user) {
      return next(new ErrorHandler("User not found!", 404));
    }

    console.log(user);

    res.status(200).json({
      success: true,
      solvedProblems: user.solvedProblems,
    });
  } catch (error) {
    console.log(error);
  }
};

// Get high-level stats for the authenticated user
export const getUserProblemStats = CatchAsyncError(async (req, res, next) => {
  const userId = req.user?._id;

  const user = await User.findById(userId)
    .select("solvedProblems codingStats")
    .lean();

  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  const solvedIds = user.solvedProblems || [];

  // Fetch solved problem documents with needed fields
  const solvedProblems = await Problem.find({ _id: { $in: solvedIds } })
    .select("title slug difficulty lab category")
    .populate("lab", "name slug labType")
    .lean();

  // Aggregate counts by difficulty
  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  // Aggregate counts by lab
  const solvedByLabMap = new Map();

  for (const p of solvedProblems) {
    if (p.difficulty && solvedByDifficulty.hasOwnProperty(p.difficulty)) {
      solvedByDifficulty[p.difficulty] += 1;
    }
    const labId = p.lab?._id?.toString();
    if (labId) {
      const key = labId;
      const curr = solvedByLabMap.get(key) || {
        labId: p.lab._id,
        labName: p.lab.name,
        labSlug: p.lab.slug,
        labType: p.lab.labType,
        solvedCount: 0,
      };
      curr.solvedCount += 1;
      solvedByLabMap.set(key, curr);
    }
  }

  const labsList = Array.from(solvedByLabMap.values());
  const labTotals = await Problem.aggregate([
    { $match: { lab: { $in: labsList.map((l) => l.labId) } } },
    { $group: { _id: "$lab", total: { $sum: 1 } } },
  ]);
  const labTotalsMap = new Map(
    labTotals.map((d) => [d._id.toString(), d.total]),
  );
  const solvedByLab = labsList.map((l) => ({
    ...l,
    totalProblemsInLab: labTotalsMap.get(l.labId.toString()) || 0,
    progressPercent:
      l.solvedCount && labTotalsMap.get(l.labId.toString())
        ? Math.round(
            (l.solvedCount / labTotalsMap.get(l.labId.toString())) * 100,
          )
        : 0,
  }));

  return res.status(200).json({
    success: true,
    codingStats: user.codingStats || {
      totalProblemsSolved: solvedIds.length,
      totalSubmissions: 0,
      acceptedSubmissions: 0,
      successRate: 0,
    },
    counts: {
      totalSolved: solvedIds.length,
      byDifficulty: solvedByDifficulty,
      byLab: solvedByLab,
    },
  });
});

export const getSolvedProblemsDetailed = CatchAsyncError(
  async (req, res, next) => {
    const userId = req.user?._id;

    const user = await User.findById(userId).select("solvedProblems").lean();
    if (!user) {
      return next(new ErrorHandler("User not found!", 404));
    }

    const solvedIds = user.solvedProblems || [];
    if (solvedIds.length === 0) {
      return res.status(200).json({ success: true, problems: [] });
    }

    // Fetch last accepted submission timestamp per problem
    const acceptedAgg = await Submission.aggregate([
      {
        $match: {
          user: userId,
          problem: { $in: solvedIds },
          executionResult: "Passed",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$problem",
          lastAcceptedAt: { $first: "$createdAt" },
          language: { $first: "$language" },
        },
      },
    ]);
    const acceptedMap = new Map(
      acceptedAgg.map((d) => [
        d._id.toString(),
        { lastAcceptedAt: d.lastAcceptedAt, language: d.language },
      ]),
    );

    const problems = await Problem.find({ _id: { $in: solvedIds } })
      .select("title slug difficulty lab category")
      .populate("lab", "name slug labType")
      .populate("category", "name slug")
      .lean();

    const detailed = problems.map((p) => ({
      problemId: p._id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      lab: p.lab
        ? {
            id: p.lab._id,
            name: p.lab.name,
            slug: p.lab.slug,
            labType: p.lab.labType,
          }
        : null,
      category: p.category
        ? { id: p.category._id, name: p.category.name, slug: p.category.slug }
        : null,
      lastAcceptedAt: acceptedMap.get(p._id.toString())?.lastAcceptedAt || null,
      lastAcceptedLanguage: acceptedMap.get(p._id.toString())?.language || null,
    }));

    return res.status(200).json({ success: true, problems: detailed });
  },
);

// ============== Account Disable (Soft Delete) Flow ==============
export const requestAccountDeletionOtp = CatchAsyncError(
  async (req, res, next) => {
    const context = { requestId: res.locals.requestId };

    const email = await requestDeletionOtpService(req.user._id, context);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      `OTP sent successfully to ${email}`,
    );
  },
);

export const confirmAccountDisable = CatchAsyncError(async (req, res, next) => {
  const { password, otp } = req.body;
  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await confirmAccountDisableService(req.user._id, { password, otp }, context);

  // Clear Cookies (Logout the user)
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "Account disabled. You can no longer log in.",
  );
});

// ================= Change Email (Dual OTP) =================
export const requestEmailChange = CatchAsyncError(async (req, res, next) => {
  const { newEmail } = req.body;
  const context = { requestId: res.locals.requestId };

  await requestEmailChangeService(req.user._id, newEmail, context);

  return sendResponse(
    res,
    HTTP_STATUS.OK,
    "OTPs sent to current and new email successfully.",
  );
});

export const verifyEmailChange = CatchAsyncError(async (req, res, next) => {
  const { newEmail, currentOtp, newOtp } = req.body;
  const context = {
    requestId: res.locals.requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await verifyEmailChangeService(
    req.user._id,
    { newEmail, currentOtp, newOtp },
    context,
  );

  const accessToken = await user.generateAccessToken();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Email updated successfully",
    user: { _id: user._id, email: user.email, name: user.name },
    accessToken,
  });
});

export const getReferralCode = CatchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user || user.isDisabled) {
    return next(new ErrorHandler("User not found or disabled", 404));
  }

  const referralLink = `${process.env.FRONTEND_URL}/SignUp?ref=${user.referralCode}`;

  res.status(200).json({
    success: true,
    referralCode: user.referralCode,
    referralLink,
  });
});

export const getReferralStats = CatchAsyncError(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user || user.isDisabled) {
    return next(new ErrorHandler("User not found or disabled", 404));
  }

  const totalReferrals = user.referrals.length;

  const referredUsers = await User.find({ referredBy: user._id })
    .select("name email createdAt")
    .lean();

  const formattedUsers = referredUsers.map((u) => ({
    ...u,
    createdAt: new Date(u.createdAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  res.status(200).json({
    success: true,
    totalReferrals,
    referredUsers: formattedUsers,
  });
});

// controllers/user.controller.js

export const getUsersBatchInternal = CatchAsyncError(async (req, res, next) => {
  const requestId = req.requestId || "INTERNAL";
  const { userIds } = req.body;

  logger.info(`[${requestId}] Internal Service: Fetching user batch for ${userIds?.length} IDs`);

  if (!userIds || !Array.isArray(userIds)) {
    throw new ErrorHandler(
      "userIds array is required", 
      HTTP_STATUS.BAD_REQUEST, 
      ERROR_CODES.INVALID_INPUT
    );
  }

  const users = await User.find({ 
    _id: { $in: userIds },
    isDisabled: false 
  })
  .select("name image role") 
  .lean();

  logger.info(`[${requestId}] Internal Service: Successfully found ${users.length} users`);

  return sendResponse(
    res, 
    HTTP_STATUS.OK, 
    "Batch users fetched successfully", 
    users
  );
});
