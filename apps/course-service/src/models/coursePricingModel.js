import mongoose from "mongoose";

const pricingPlanSchema = new mongoose.Schema(
  {
    planCode: {
      type: String,
      enum: ["free", "standard", "enterprise"],
      required: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    billingCycle: {
      type: String,
      enum: ["one_time", "monthly", "yearly"],
      default: "one_time",
    },

    features: [
      {
        type: String,
        trim: true,
      },
    ],

    trialDays: {
      type: Number,
      default: 0,
    },

    accessDurationDays: {
      type: Number,
      default: null, 
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const coursePricingSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
    },

    plans: {
      type: [pricingPlanSchema],
      validate: {
        validator: function (plans) {
          const codes = plans.map(p => p.planCode);
          return codes.length === new Set(codes).size; 
        },
        message: "Duplicate pricing plans are not allowed",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

coursePricingSchema.index({ courseId: 1 });

const CoursePricing = mongoose.model("CoursePricing", coursePricingSchema);
export default CoursePricing