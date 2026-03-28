import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid Course ID"),
  }),
  body: z.object({
    rating: z
      .number({ required_error: "Rating is required" })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot be more than 5")
      .step(0.5, "Rating must be in increments of 0.5"),
    reviewText: z
      .string()
      .trim()
      .max(1000, "Review cannot exceed 1000 characters")
      .optional(),
  }),
});

export const updateReviewSchema = z.object({
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, "Invalid Review ID"),
  }),
  body: z
    .object({
      rating: z.number().min(1).max(5).step(0.5).optional(),
      reviewText: z.string().trim().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message:
        "At least one field (rating or reviewText) must be provided for update",
    }),
});

export const getReviewsQuerySchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex, "Invalid Course ID"),
  }),
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => parseInt(val || "1")),
    limit: z
      .string()
      .optional()
      .transform((val) => parseInt(val || "10")),
    sort: z.enum(["latest", "helpful"]).default("helpful"),
  }),
});

export const toggleReviewStatusSchema = z.object({
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, "Invalid Review ID"),
  }),
  body: z.object({
    isPublished: z.boolean({
      required_error: "isPublished status is required",
    }),
  }),
});
