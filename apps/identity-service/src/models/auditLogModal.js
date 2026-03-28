import mongoose from "mongoose";
import { AUDIT_ACTIONS, AUDIT_STATUS } from "../utils/auditActions.js";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ACTIONS),
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(AUDIT_STATUS),
      default: "SUCCESS",
    },

    ipAddress: String,

    userAgent: String,

    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
