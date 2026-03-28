import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateReferralCode } from "../utils/generateReferralCode.js";

dotenv.config();

const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please Enter a Valid Email",
      },
    },

    isDisabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    image: String,

    password: {
      type: String,
      required: function () {
        return !this.googleAuth;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    googleAuth: {
      type: Boolean,
      default: false,
    },

    // 🔐 SECURITY SECTION
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    tokenVersion: {
      type: Number,
      default: 0, // logout all sessions support
    },

    passwordChangedAt: Date,

    passwordHistory: [
      {
        password: String,
        changedAt: Date,
      },
    ],

    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: String,

    accountDeletion: {
      otp: String,
      expiresAt: Date,
    },

    gender: String,
    phone: String,
    country: String,
    city: String,

    socialMedia: {
      linkedin: String,
      github: String,
      twitter: String,
    },

    emailChange: {
      newEmail: String,
      currentEmailOtp: String,
      newEmailOtp: String,
      expiresAt: Date,
    },

    referralCode: {
      type: String,
      unique: true,
      index: true,
    },

    codingStats: {
      totalProblemsSolved: { type: Number, default: 0 },
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },

    favoriteProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    badges: [
      {
        title: String,
        icon: String,
        achievedAt: Date,
      },
    ],

    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      defaultLanguage: { type: String, default: "cpp" },
    },

    streakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Streak",
    },

    lastActivity: Date,

    projectsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProjectRegistration",
      },
    ],

    hackathonParticipation: [
      {
        hackathonId: mongoose.Schema.Types.ObjectId,
        participatedAt: Date,
        score: Number,
      },
    ],

    certifications: [
      {
        title: String,
        issuedAt: Date,
        credentialUrl: String,
      },
    ],

    role: {
      type: String,
      enum: ["user", "moderator", "lab_admin", "org_admin", "super_admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

userSchema.index(
  { streakId: 1 },
  {
    unique: true,
    partialFilterExpression: { streakId: { $exists: true, $ne: null } },
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.googleAuth) return next();
  if (this.passwordHistory.length > 0) {
    for (const old of this.passwordHistory) {
      const isMatch = await bcrypt.compare(this.password, old.password);
      if (isMatch) {
        throw new Error("You cannot reuse old passwords");
      }
    }
  }

  const hashedPassword = await bcrypt.hash(this.password, SALT_ROUNDS);

  if (this.password) {
    this.passwordHistory.push({
      password: hashedPassword,
      changedAt: new Date(),
    });

    if (this.passwordHistory.length > 5) {
      this.passwordHistory.shift();
    }
  }

  this.password = hashedPassword;
  this.passwordChangedAt = new Date();

  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { failedLoginAttempts: 1 } };

  if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
      tokenVersion: this.tokenVersion,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
};

userSchema.pre("validate", function (next) {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode();
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
