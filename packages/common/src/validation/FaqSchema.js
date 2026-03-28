import { z } from "zod";

export const courseFAQValidationSchema = {
  create: z.object({
    body: z.object({
      courseId: z
        .string({ required_error: "Course ID is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
      question: z
        .string({ required_error: "Question is required" })
        .trim()
        .min(5, "Question must be at least 5 characters long")
        .max(500, "Question is too long"),
      answer: z
        .string({ required_error: "Answer is required" })
        .trim()
        .min(2, "Answer is too short"),
      order: z.number().int().min(0).optional(),
      isPublished: z.boolean().optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      faqId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID"),
    }),
    body: z
      .object({
        question: z.string().trim().min(5).max(500).optional(),
        answer: z.string().trim().min(2).optional(),
        order: z.number().int().min(0).optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
      }),
  }),

  updateStatus: z.object({
    params: z.object({
      faqId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID"),
    }),
    body: z.object({
      isPublished: z.boolean({
        required_error: "isPublished status is required",
      }),
    }),
  }),

  reorder: z.object({
    body: z.object({
      faqs: z
        .array(
          z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid FAQ ID"),
            order: z.number().int().min(0),
          }),
        )
        .min(1, "FAQs array cannot be empty"),
    }),
  }),
};
