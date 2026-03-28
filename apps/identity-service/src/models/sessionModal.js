import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    deviceName: {
      type: String, 
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 } 
);

sessionSchema.methods.revoke = async function () {
  this.isRevoked = true;
  this.revokedAt = new Date();
  await this.save();
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;
