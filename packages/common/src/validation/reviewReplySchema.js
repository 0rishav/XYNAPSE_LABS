import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReplySchema = z.object({
  params: z.object({
    reviewId: z.string().regex(objectIdRegex, "Invalid Review ID"),
  }),
  body: z.object({
    replyText: z
      .string({ required_error: "Reply text is required" })
      .trim()
      .min(1, "Reply cannot be empty")
      .max(500, "Reply cannot exceed 500 characters"),
  }),
});

export const updateReplySchema = z.object({
  params: z.object({
    replyId: z.string().regex(objectIdRegex, "Invalid Reply ID"),
  }),
  body: z.object({
    replyText: z
      .string({ required_error: "Reply text is required" })
      .trim()
      .min(1, "Reply cannot be empty")
      .max(500, "Reply cannot exceed 500 characters"),
  }),
});

export const getRepliesQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => parseInt(val || "1")),
    limit: z
      .string()
      .optional()
      .transform((val) => parseInt(val || "10")),
  }),
});
