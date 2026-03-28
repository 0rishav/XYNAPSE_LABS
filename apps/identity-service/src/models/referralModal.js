import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
      index: true,
    },

    rewardAmount: {
      type: Number,
      default: 0,
    },

    rewardGranted: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "pending",
      index: true,
    },

    referredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

referralSchema.index(
  { referredUserId: 1 },
  { unique: true }
);

referralSchema.index(
  { referrerId: 1, status: 1 }
);

referralSchema.index(
  { status: 1, referredAt: -1 }
);

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
