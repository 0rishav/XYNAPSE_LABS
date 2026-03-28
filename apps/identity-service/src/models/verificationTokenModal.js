import mongoose from "mongoose";
import crypto from "crypto";

const TOKEN_TYPES = [
  "email_verify",
  "reset_password",
  "2fa_challenge",
  "account_delete",
  "email_change",
  "magic_login",
];

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: TOKEN_TYPES,
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true, // high selectivity
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: Date,

    ipAddress: String,
    userAgent: String,

    metadata: {
      type: mongoose.Schema.Types.Mixed, 
      // optional extra data (newEmail, otpDigits etc)
    },
  },
  { timestamps: true },
);

verificationTokenSchema.index(
  { tokenHash: 1, type: 1, isUsed: 1 },
  { name: "token_validation_index" }
);

verificationTokenSchema.index(
  { userId: 1, type: 1, isUsed: 1 },
  { name: "user_active_token_index" }
);

verificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

verificationTokenSchema.statics.generateToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, tokenHash };
};

verificationTokenSchema.methods.markAsUsed = async function () {
  this.isUsed = true;
  this.usedAt = new Date();
  await this.save();
};

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema
);

export default VerificationToken;
