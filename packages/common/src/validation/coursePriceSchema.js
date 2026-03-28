import { z } from "zod";

const pricingPlanSchema = z.object({
  planCode: z.enum(["free", "standard", "enterprise"], {
    errorMap: () => ({
      message: "planCode must be free, standard, or enterprise",
    }),
  }),
  displayName: z.string().trim().min(2, "Display name is too short").max(100),
  price: z.number().nonnegative("Price cannot be negative"),
  currency: z.string().default("INR"),
  billingCycle: z.enum(["one_time", "monthly", "yearly"]).default("one_time"),
  features: z
    .array(z.string().trim())
    .min(1, "At least one feature is required"),
  trialDays: z.number().int().nonnegative().default(0),
  accessDurationDays: z.number().int().nonnegative().nullable().default(null),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createPricingSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
  }),
  body: z.object({
    plans: z
      .array(pricingPlanSchema)
      .min(1, "At least one pricing plan is required")
      .refine(
        (plans) => {
          const codes = plans.map((p) => p.planCode);
          return codes.length === new Set(codes).size;
        },
        {
          message: "Duplicate plan codes are not allowed in the same course",
        },
      ),
  }),
});

export const updatePricingSchema = createPricingSchema;

export const getAdminPricingSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
  }),
});

export const deletePricingSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
  }),
});

export const getUserPricingSchema = z.object({
  params: z.object({
    courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Course ID"),
  }),
});
